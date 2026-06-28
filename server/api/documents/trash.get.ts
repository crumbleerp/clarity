import { eq, and, isNotNull, desc } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { requireModeratorOrAbove } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const type = query.type as string | undefined

  const db = useDb()
  const conditions = [
    eq(documents.dataset, dataset),
    isNotNull(documents.deletedAt),
    eq(documents.isRevision, false)
  ]

  if (type) conditions.push(eq(documents.type, type))

  const rows = await db.select().from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.deletedAt))

  return {
    documents: rows.map(mergeDocument)
  }
})
