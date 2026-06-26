import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const db = useDb()
  const rows = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .limit(1)

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  return mergeDocument(rows[0]!)
})
