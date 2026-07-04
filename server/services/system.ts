import { eq, and } from 'drizzle-orm'
import { upsertSchema } from './schema'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { invalidateCache } from './cache'

export const CLARITY_FILE_TYPE = '_clarity.file'
export const CLARITY_FILE_TAG_TYPE = '_clarity.file_tags'

export const FILE_SCHEMA_FIELDS = [
  { name: 'assetId', title: 'Asset ID', type: 'string', validation: [{ type: 'required' }] },
  { name: 'originalFilename', title: 'Original Filename', type: 'string', validation: [{ type: 'required' }] },
  { name: 'mimeType', title: 'MIME Type', type: 'string', validation: [{ type: 'required' }] },
  { name: 'extension', title: 'Extension', type: 'string', validation: [{ type: 'required' }] },
  { name: 'size', title: 'Size', type: 'number', validation: [{ type: 'required' }] },
  { name: 'path', title: 'Path', type: 'string', validation: [{ type: 'required' }] },
  { name: 'url', title: 'URL', type: 'url', validation: [{ type: 'required' }] },
  {
    name: 'tags',
    title: 'Tags',
    type: 'array',
    of: [{ name: 'tag', title: 'Tag', type: 'string' }]
  },
  { name: 'metadata', title: 'Metadata', type: 'object', fields: [
    { name: 'dimensions', title: 'Dimensions', type: 'object', fields: [
      { name: 'width', title: 'Width', type: 'number' },
      { name: 'height', title: 'Height', type: 'number' },
      { name: 'aspectRatio', title: 'Aspect Ratio', type: 'number' },
      { name: 'hasAlpha', title: 'Has Alpha', type: 'boolean' }
    ] }
  ] }
]

export const FILE_TAG_SCHEMA_FIELDS = [
  { name: 'name', title: 'Name', type: 'string', validation: [{ type: 'required' }] },
  { name: 'title', title: 'Title', type: 'string' }
]

export async function ensureFileSchema(dataset: string) {
  await upsertSchema({
    name: CLARITY_FILE_TYPE,
    title: 'Clarity File',
    schemaType: 'document',
    fields: FILE_SCHEMA_FIELDS,
    dataset
  })
}

export async function ensureFileTagSchema(dataset: string) {
  await upsertSchema({
    name: CLARITY_FILE_TAG_TYPE,
    title: 'Clarity File Tag',
    schemaType: 'document',
    fields: FILE_TAG_SCHEMA_FIELDS,
    dataset
  })
}

export interface FileAssetData {
  assetId: string
  originalFilename: string
  mimeType: string
  extension: string
  size: number
  path: string
  url: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export async function ensureFileTagDocuments(dataset: string, tags: string[]) {
  if (tags.length === 0) return
  await ensureFileTagSchema(dataset)

  const db = useDb()
  const now = new Date()

  for (const tag of tags) {
    const name = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name) continue

    const existing = await db.select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, name), eq(documents.dataset, dataset), eq(documents.type, CLARITY_FILE_TAG_TYPE)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(documents).values({
        id: name,
        dataset,
        type: CLARITY_FILE_TAG_TYPE,
        rev: crypto.randomUUID(),
        status: 'published',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        data: { name, title: tag.trim() }
      })
    }
  }
}

export async function createClarityFileDocument(dataset: string, data: FileAssetData) {
  const db = useDb()
  const id = `${data.assetId}-file`
  const now = new Date()

  await ensureFileSchema(dataset)

  if (data.tags && data.tags.length > 0) {
    await ensureFileTagDocuments(dataset, data.tags)
  }

  const existing = await db.select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .limit(1)

  const docData: Record<string, unknown> = {
    assetId: data.assetId,
    originalFilename: data.originalFilename,
    mimeType: data.mimeType,
    extension: data.extension,
    size: data.size,
    path: data.path,
    url: data.url
  }

  if (data.tags && data.tags.length > 0) {
    docData.tags = data.tags
  }

  if (data.metadata) {
    docData.metadata = data.metadata
  }

  if (existing.length > 0) {
    await db.update(documents)
      .set({ data: docData, updatedAt: now, rev: crypto.randomUUID() })
      .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
  } else {
    await db.insert(documents).values({
      id,
      dataset,
      type: CLARITY_FILE_TYPE,
      rev: crypto.randomUUID(),
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      data: docData
    })
  }

  invalidateCache(dataset)
  return id
}
