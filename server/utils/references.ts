import { eq, and, sql } from 'drizzle-orm'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { mergeDocument } from './merge'

export async function findReferencingDocuments(dataset: string, id: string) {
  const db = useDb()
  const pattern = sql`${documents.data}::text like ${`%"_ref":"${id}"%`}`

  const rows = await db.select().from(documents)
    .where(and(
      eq(documents.dataset, dataset),
      pattern,
      eq(documents.isRevision, false)
    ))

  return rows.map(mergeDocument)
}

function removeRefs(value: unknown, targetId: string): unknown {
  if (Array.isArray(value)) {
    return value.map(item => removeRefs(item, targetId))
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if (obj._ref === targetId) {
      return null
    }

    const next: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) {
      next[key] = removeRefs(val, targetId)
    }
    return next
  }

  return value
}

export function stripReferences(data: Record<string, unknown>, targetId: string): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    next[key] = removeRefs(val, targetId)
  }
  return next
}
