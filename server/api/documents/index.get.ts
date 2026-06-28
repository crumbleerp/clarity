import { eq, and, count, isNull, sql } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

defineRouteMeta({
  openAPI: {
    tags: ['documents'],
    description: 'List documents with pagination',
    parameters: [
      { in: 'query', name: 'dataset', schema: { type: 'string' } },
      { in: 'query', name: 'type', schema: { type: 'string' } },
      { in: 'query', name: 'limit', schema: { type: 'integer' } },
      { in: 'query', name: 'offset', schema: { type: 'integer' } },
      { in: 'query', name: 'search', schema: { type: 'string' } },
      { in: 'query', name: 'includeArchived', schema: { type: 'boolean' } }
    ]
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const type = query.type as string | undefined
  const status = query.status as string | undefined
  const search = (query.search as string) || ''
  const includeDeleted = query.includeDeleted === 'true'
  const includeRevisions = query.includeRevisions === 'true'
  const includeArchived = query.includeArchived === 'true'
  const orderBy = (query.orderBy as string) || 'updatedAt'
  const orderDir = (query.orderDir as string) || 'desc'
  const requestedLimit = Number(query.limit)
  const limit = Number.isNaN(requestedLimit) || requestedLimit <= 0 ? 50 : requestedLimit
  const offset = Number(query.offset) || 0

  const db = useDb()
  const conditions = [eq(documents.dataset, dataset)]

  if (type) conditions.push(eq(documents.type, type))
  if (status) conditions.push(eq(documents.status, status as 'draft' | 'published' | 'archived'))
  if (!includeArchived) conditions.push(sql`${documents.status} in ('draft', 'published')`)
  if (!includeDeleted) conditions.push(isNull(documents.deletedAt))
  if (!includeRevisions) conditions.push(eq(documents.isRevision, false))

  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`
    conditions.push(sql`lower(${documents.data}::text) like ${term}`)
  }

  const where = and(...conditions)

  const orderColumn = orderBy === 'createdAt'
    ? documents.createdAt
    : orderBy === 'publishedAt'
      ? documents.publishedAt
      : documents.updatedAt

  const order = orderDir === 'asc' ? orderColumn : sql`${orderColumn} desc`

  const [rows, totalRows] = await Promise.all([
    db.select().from(documents).where(where).orderBy(order).limit(limit).offset(offset),
    db.select({ count: count() }).from(documents).where(where)
  ])

  return {
    documents: rows.map(mergeDocument),
    total: totalRows[0]?.count || 0,
    limit,
    offset
  }
})
