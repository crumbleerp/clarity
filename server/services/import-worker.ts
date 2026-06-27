import { createClient } from '@sanity/client'
import { eq, and } from 'drizzle-orm'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { schemas } from '../db/schema/schemas'
import {
  inferSchemas,
  mapDocument,
  extractSchemasFromDocument,
  isAssetDoc,
  transformAssetRefs,
  fetchAssetBuffer,
  getAssetId
} from './import'
import { uploadToS3 } from '../utils/s3'
import { updateJob, addJobLog } from './jobs'
import { invalidateCache } from './cache'

const ASSET_CONCURRENCY = 10

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const taskIndex = index++
      try {
        await tasks[taskIndex]!()
      } catch {
        // individual task handles its own errors
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  await Promise.all(workers)
}

export interface ImportConfig {
  projectId: string
  dataset: string
  token: string
  apiVersion: string
  targetDataset: string
}

export async function runImportJob(jobId: string, config: ImportConfig) {
  await updateJob(jobId, 'running')

  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    token: config.token,
    useCdn: false
  })

  const datasetName = config.targetDataset

  try {
    await addJobLog(jobId, `Fetching documents from Sanity ${config.projectId}/${config.dataset}`)
    const docs = await client.fetch<Record<string, unknown>[]>('*')
    await addJobLog(jobId, `Fetched ${docs.length} documents`)

    // Fetch and upload Sanity assets to S3
    const assetDocs = docs.filter(isAssetDoc)
    await addJobLog(jobId, `Found ${assetDocs.length} assets to download`)
    const assetUrlMap = new Map<string, string>()
    const assetUploadErrors: string[] = []

    const assetTasks = assetDocs.map((asset, idx) => async () => {
      const id = asset._id as string
      const url = asset.url as string | undefined
      const extension = (asset.extension as string) || ''
      const mimeType = (asset.mimeType as string) || 'application/octet-stream'
      const assetId = getAssetId(id)

      if (!url) {
        assetUploadErrors.push(`Asset ${id} has no url`)
        await addJobLog(jobId, `Asset ${id}: missing url, skipping`)
        return
      }

      try {
        const buffer = await fetchAssetBuffer(url)
        const key = `assets/${assetId}.${extension}`
        const localUrl = await uploadToS3(key, buffer, mimeType)
        assetUrlMap.set(id, localUrl)
        assetUrlMap.set(assetId, localUrl)
        await addJobLog(jobId, `Uploaded asset ${idx + 1}/${assetDocs.length}: ${id} -> ${localUrl}`)
      } catch (e: unknown) {
        const msg = `Asset ${id}: ${(e as Error).message}`
        assetUploadErrors.push(msg)
        await addJobLog(jobId, msg)
      }
    })

    await runWithConcurrency(assetTasks, ASSET_CONCURRENCY)

    await addJobLog(jobId, `Assets uploaded: ${assetUrlMap.size / 2}, errors: ${assetUploadErrors.length}`)

    const db = useDb()

    // Save asset documents so GROQ asset-> dereferencing works
    await addJobLog(jobId, `Saving ${assetDocs.length} asset documents...`)
    for (const asset of assetDocs) {
      const id = asset._id as string
      const localUrl = assetUrlMap.get(id)
      if (!localUrl) continue

      const assetData = { ...asset, url: localUrl }
      const mapped = mapDocument(assetData)

      const existing = await db.select().from(documents)
        .where(and(eq(documents.id, mapped.id), eq(documents.dataset, datasetName)))
        .limit(1)

      if (existing.length > 0) {
        await db.update(documents)
          .set({
            type: mapped.type,
            rev: mapped.rev,
            createdAt: new Date(mapped.createdAt),
            updatedAt: new Date(mapped.updatedAt),
            data: mapped.data
          })
          .where(and(eq(documents.id, mapped.id), eq(documents.dataset, datasetName)))
      } else {
        await db.insert(documents).values({
          id: mapped.id,
          dataset: datasetName,
          type: mapped.type,
          rev: mapped.rev,
          createdAt: new Date(mapped.createdAt),
          updatedAt: new Date(mapped.updatedAt),
          data: mapped.data
        })
      }
    }

    const filteredDocs = docs.filter((d) => {
      const t = d._type
      return typeof t === 'string' && !t.startsWith('_') && !t.startsWith('sanity.') && !t.startsWith('system.')
    })

    const typeCounts = filteredDocs.reduce<Record<string, number>>((acc, d) => {
      const t = d._type as string
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {})
    await addJobLog(jobId, `Document counts: ${Object.entries(typeCounts).map(([t, c]) => `${t}=${c}`).join(', ')}`)

    const skippedDocs = docs.filter((d) => {
      const t = d._type
      return typeof t === 'string' && (t.startsWith('_') || t.startsWith('sanity.') || t.startsWith('system.'))
    })
    if (skippedDocs.length > 0) {
      const skippedTypes = [...new Set(skippedDocs.map(d => d._type as string))]
      await addJobLog(jobId, `Skipped ${skippedDocs.length} system docs: ${skippedTypes.join(', ')}`)
    }

    const schemaDoc = docs.find(d => d._id === '_.schemas.default' || d._type === 'system.schema')
    const inferredSchemas = schemaDoc
      ? (extractSchemasFromDocument(schemaDoc) || inferSchemas(filteredDocs))
      : inferSchemas(filteredDocs)

    await addJobLog(jobId, `Using ${schemaDoc ? 'exported schema' : 'inferred schemas'}`)
    await addJobLog(jobId, `Inferred ${inferredSchemas.length} schemas: ${inferredSchemas.map(s => s.name).join(', ')}`)

    // Upsert schemas
    await addJobLog(jobId, 'Saving schemas...')
    for (const s of inferredSchemas) {
      const existing = await db.select().from(schemas)
        .where(and(eq(schemas.name, s.name), eq(schemas.dataset, datasetName)))
        .limit(1)

      if (existing.length > 0) {
        await db.update(schemas)
          .set({
            title: s.title,
            schemaType: s.type,
            fields: s.fields,
            updatedAt: new Date()
          })
          .where(and(eq(schemas.name, s.name), eq(schemas.dataset, datasetName)))
      } else {
        await db.insert(schemas).values({
          name: s.name,
          title: s.title,
          schemaType: s.type,
          fields: s.fields,
          dataset: datasetName
        })
      }
    }

    // Upsert documents with asset refs replaced
    await addJobLog(jobId, `Saving ${filteredDocs.length} documents...`)
    for (const doc of filteredDocs) {
      const data = transformAssetRefs(doc, assetUrlMap) as Record<string, unknown>
      const mapped = mapDocument(data)

      const existing = await db.select().from(documents)
        .where(and(eq(documents.id, mapped.id), eq(documents.dataset, datasetName)))
        .limit(1)

      if (existing.length > 0) {
        await db.update(documents)
          .set({
            type: mapped.type,
            rev: mapped.rev,
            createdAt: new Date(mapped.createdAt),
            updatedAt: new Date(mapped.updatedAt),
            data: mapped.data
          })
          .where(and(eq(documents.id, mapped.id), eq(documents.dataset, datasetName)))
      } else {
        await db.insert(documents).values({
          id: mapped.id,
          dataset: datasetName,
          type: mapped.type,
          rev: mapped.rev,
          createdAt: new Date(mapped.createdAt),
          updatedAt: new Date(mapped.updatedAt),
          data: mapped.data
        })
      }
    }

    invalidateCache(datasetName)

    const summary = {
      importedDocuments: filteredDocs.length,
      importedSchemas: inferredSchemas.length,
      skippedDocuments: docs.length - filteredDocs.length,
      importedAssets: assetUrlMap.size / 2,
      assetUploadErrors: assetUploadErrors.length > 0 ? assetUploadErrors : undefined,
      types: inferredSchemas.map(s => s.name)
    }

    await addJobLog(jobId, `Import completed. Documents: ${summary.importedDocuments}, schemas: ${summary.importedSchemas}, assets: ${summary.importedAssets}`)
    await updateJob(jobId, 'completed', summary)
  } catch (e: unknown) {
    const msg = (e as Error).message
    await addJobLog(jobId, `Import failed: ${msg}`)
    await updateJob(jobId, 'failed', null, msg)
  }
}
