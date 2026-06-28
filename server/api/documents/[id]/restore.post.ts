import { eq, and, isNotNull } from 'drizzle-orm'
import { useDb } from '../../../db'
import { documents } from '../../../db/schema/documents'
import { invalidateCache } from '../../../services/cache'
import { requireModeratorOrAbove } from '../../../utils/auth'
import { logger } from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const db = useDb()
  const rows = await db.update(documents)
    .set({ deletedAt: null, updatedAt: new Date(), rev: crypto.randomUUID() })
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset), isNotNull(documents.deletedAt)))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found in trash' })
  }

  logger.info({ documentId: id, dataset }, 'Document restored')
  invalidateCache(dataset)
  return { success: true }
})
