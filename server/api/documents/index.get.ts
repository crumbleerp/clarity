import { eq, and, count } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const type = query.type as string | undefined
  const requestedLimit = Number(query.limit)
  const limit = Number.isNaN(requestedLimit) || requestedLimit <= 0 ? 1000000 : requestedLimit
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
    limit: query.limit ? limit : null,
    offset
  }
})
