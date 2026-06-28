import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { invalidateCache } from '../../services/cache'
import { requireModeratorOrAbove } from '../../utils/auth'
import { logger } from '../../utils/logger'
import { findReferencingDocuments, stripReferences } from '../../utils/references'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const permanent = query.permanent === 'true'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const db = useDb()

  if (permanent) {
    const force = query.force === 'true'

    if (!force) {
      const refs = await findReferencingDocuments(dataset, id)
      if (refs.length > 0) {
        throw createError({
          statusCode: 409,
          message: `Document is referenced by ${refs.length} other document(s). Use force=true to clear references.`,
          data: { references: refs.map(r => ({ id: r._id, type: r._type, title: ((r as Record<string, unknown>).title as string) || ((r as Record<string, unknown>).name as string) || r._id })) }
        })
      }
    }

    const rows = await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.dataset, dataset), isNull(documents.revisionOf)))
      .returning()

    if (rows.length === 0) {
      throw createError({ statusCode: 404, message: 'Document not found' })
    }

    if (force) {
      const refs = await findReferencingDocuments(dataset, id)
      for (const ref of refs) {
        const stripped = stripReferences(ref as Record<string, unknown>, id)
        await db.update(documents)
          .set({
            data: stripped,
            updatedAt: new Date(),
            rev: crypto.randomUUID()
          })
          .where(and(eq(documents.id, ref._id as string), eq(documents.dataset, dataset)))
      }
    }

    await db.delete(documents).where(eq(documents.revisionOf, id))

    logger.info({ documentId: id, dataset, force }, 'Document permanently deleted')
    invalidateCache(dataset)
    return { success: true }
  }

  const rows = await db.update(documents)
    .set({ deletedAt: new Date(), updatedAt: new Date(), rev: crypto.randomUUID() })
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset), isNull(documents.deletedAt)))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  logger.info({ documentId: id, dataset }, 'Document soft deleted')
  invalidateCache(dataset)
  return { success: true }
})
