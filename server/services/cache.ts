import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { mergeDocument } from '../utils/merge'

const cache = new Map<string, Record<string, unknown>[]>()

export function getCache(dataset: string) {
  return cache.get(dataset) || null
}

export function setCache(dataset: string, data: Record<string, unknown>[]) {
  cache.set(dataset, data)
}

export function invalidateCache(dataset: string) {
  cache.delete(dataset)
}

export async function loadCache(dataset: string): Promise<Record<string, unknown>[]> {
  const existing = getCache(dataset)
  if (existing) return existing

  const db = useDb()
  const rows = await db.select().from(documents).where(eq(documents.dataset, dataset))
  const merged = rows.map(mergeDocument)
  setCache(dataset, merged)
  return merged
}
