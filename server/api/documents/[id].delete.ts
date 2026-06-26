import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { invalidateCache } from '../../services/cache'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const db = useDb()
  const rows = await db.delete(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  invalidateCache(dataset)
  return { success: true }
})
