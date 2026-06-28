import { eq, and, desc } from 'drizzle-orm'
import { useDb } from '../../../db'
import { documents } from '../../../db/schema/documents'
import { mergeDocument } from '../../../utils/merge'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const db = useDb()
  const rows = await db.select().from(documents)
    .where(and(
      eq(documents.dataset, dataset),
      eq(documents.isRevision, true),
      eq(documents.revisionOf, id)
    ))
    .orderBy(desc(documents.createdAt))

  return {
    revisions: rows.map(mergeDocument)
  }
})
