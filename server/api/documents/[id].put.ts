import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const { _type, _id, _rev, _createdAt, _updatedAt, _originalId, ...data } = body

  const db = useDb()
  const rows = await db.update(documents)
    .set({ data, updatedAt: new Date(), rev: crypto.randomUUID() })
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  invalidateCache(dataset)
  return mergeDocument(rows[0]!)
})
