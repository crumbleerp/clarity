import { eq, and, isNull, sql } from 'drizzle-orm'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { schemas } from '../db/schema/schemas'
import { mergeDocument } from '../utils/merge'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  requireUser(event)

  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const term = (query.q as string || '').trim().toLowerCase()

  if (!term || term.length < 2) {
    return { documents: [], schemas: [] }
  }

  const db = useDb()
  const likeTerm = `%${term}%`
  const dataPattern = sql`lower(${documents.data}::text) like ${likeTerm}`

  const docRows = await db.select().from(documents)
    .where(and(
      eq(documents.dataset, dataset),
      isNull(documents.deletedAt),
      eq(documents.isRevision, false),
      dataPattern
    ))
    .limit(20)

  const schemaRows = await db.select().from(schemas)
    .where(and(
      eq(schemas.dataset, dataset),
      sql`lower(${schemas.name}) like ${likeTerm} or lower(${schemas.title}) like ${likeTerm}`
    ))
    .limit(10)

  return {
    documents: docRows.map(mergeDocument).map(d => ({
      id: d._id,
      type: d._type,
      title: ((d as Record<string, unknown>).title as string) || ((d as Record<string, unknown>).name as string) || d._id,
      status: d._status
    })),
    schemas: schemaRows.map(s => ({
      id: s.id,
      name: s.name,
      title: s.title
    }))
  }
})
