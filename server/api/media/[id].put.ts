import { eq, and, inArray } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'

const ASSET_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Asset ID required' })
  }

  const db = useDb()
  const existing = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset), inArray(documents.type, ASSET_TYPES)))
    .limit(1)

  if (existing.length === 0) {
    throw createError({ statusCode: 404, message: 'Asset not found' })
  }

  const currentData = existing[0]!.data as Record<string, unknown>
  const { title, altText, description, tags, originalFilename } = body as Record<string, unknown>

  const data = {
    ...currentData,
    ...(title !== undefined && { title }),
    ...(altText !== undefined && { altText }),
    ...(description !== undefined && { description }),
    ...(tags !== undefined && { tags }),
    ...(originalFilename !== undefined && { originalFilename })
  }

  const rows = await db.update(documents)
    .set({ data, updatedAt: new Date(), rev: crypto.randomUUID() })
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .returning()

  invalidateCache(dataset)
  return mergeDocument(rows[0]!)
})
