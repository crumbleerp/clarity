import { eq, inArray, and } from 'drizzle-orm'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { getPublicUrl } from '../utils/s3'
import { invalidateCache } from './cache'
import { updateJob, addJobLog } from './jobs'
import { logger } from '../utils/logger'

const ASSET_TYPES = ['sanity.imageAsset', 'sanity.fileAsset', '_clarity.file']

export interface RegenerateUrlsConfig {
  dataset: string
}

export async function runRegenerateUrlsJob(jobId: string, config: RegenerateUrlsConfig) {
  logger.info({ jobId, config }, 'Starting regenerate URLs job')
  await updateJob(jobId, 'running')
  await addJobLog(jobId, `Starting URL regeneration for dataset "${config.dataset}"`)

  const dataset = config.dataset
  const db = useDb()

  try {
    const rows = await db.select().from(documents)
      .where(
        and(
          eq(documents.dataset, dataset),
          inArray(documents.type, ASSET_TYPES)
        )
      )

    await addJobLog(jobId, `Found ${rows.length} asset documents`)

    let updated = 0
    const now = new Date()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const data = (row.data || {}) as Record<string, unknown>
      const path = data.path as string | undefined
      if (!path) continue

      const newUrl = getPublicUrl(path)
      if (newUrl === data.url) continue

      await db.update(documents)
        .set({
          data: { ...data, url: newUrl },
          updatedAt: now,
          rev: crypto.randomUUID()
        })
        .where(eq(documents.id, row.id))

      updated++

      if (updated % 100 === 0) {
        await addJobLog(jobId, `Processed ${i + 1}/${rows.length}, updated ${updated}`)
      }
    }

    invalidateCache(dataset)

    const summary = { updated, total: rows.length }
    await addJobLog(jobId, `URL regeneration completed. Updated ${updated}/${rows.length} documents`)
    await updateJob(jobId, 'completed', summary)
    logger.info({ jobId, summary }, 'Regenerate URLs job completed')
  } catch (e: unknown) {
    const msg = (e as Error).message
    await addJobLog(jobId, `Regenerate URLs failed: ${msg}`)
    await updateJob(jobId, 'failed', null, msg)
    logger.error({ err: e, jobId }, 'Regenerate URLs job failed')
  }
}
