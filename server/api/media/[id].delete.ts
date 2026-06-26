import { eq, and, inArray } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { invalidateCache } from '../../services/cache'

const ASSET_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Asset ID required' })
  }

  const db = useDb()
  const rows = await db.delete(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset), inArray(documents.type, ASSET_TYPES)))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Asset not found' })
  }

  invalidateCache(dataset)
  return { success: true }
})
