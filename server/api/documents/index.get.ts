import { eq, and, count } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const type = query.type as string | undefined
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const db = useDb()
  const conditions = [eq(documents.dataset, dataset)]
  if (type) conditions.push(eq(documents.type, type))

  const where = and(...conditions)

  const [rows, totalRows] = await Promise.all([
    db.select().from(documents).where(where).limit(limit).offset(offset),
    db.select({ count: count() }).from(documents).where(where)
  ])

  return {
    documents: rows.map(mergeDocument),
    total: totalRows[0]?.count || 0,
    limit,
    offset
  }
})
