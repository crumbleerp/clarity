import { eq, and, isNull, inArray } from 'drizzle-orm'
import type { documents as documentsTable } from '../db/schema/documents'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { mergeDocument } from '../utils/merge'

export type GroqPerspective = 'published' | 'previewDrafts' | 'raw'

type DocumentRow = typeof documentsTable.$inferSelect

const cache = new Map<string, Record<string, unknown>[]>()

interface QueryCacheEntry {
  value: unknown
  expiresAt: number
}

const queryCache = new Map<string, QueryCacheEntry>()

export function getCache(dataset: string) {
  return cache.get(dataset) || null
}

export function setCache(dataset: string, data: Record<string, unknown>[]) {
  cache.set(dataset, data)
}

export function invalidateCache(dataset: string) {
  for (const key of cache.keys()) {
    if (key === dataset || key.startsWith(`${dataset}:`)) {
      cache.delete(key)
    }
  }
  invalidateQueryCache(dataset)
}

function getBaseId(row: DocumentRow): string {
  return row.isRevision ? (row.revisionOf || row.id) : row.id
}

function pickLatest(rows: DocumentRow[]): DocumentRow | undefined {
  return rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
}

function toDocumentView(row: DocumentRow, baseId: string): Record<string, unknown> {
  const doc = mergeDocument(row)
  doc._id = baseId
  doc._originalId = baseId
  doc._isRevision = false
  return doc
}

export async function loadCache(dataset: string, perspective: GroqPerspective = 'published'): Promise<Record<string, unknown>[]> {
  const cacheKey = `${dataset}:${perspective}`
  const existing = cache.get(cacheKey)
  if (existing) return existing

  const db = useDb()

  let rows: DocumentRow[]

  if (perspective === 'raw') {
    rows = await db.select().from(documents).where(eq(documents.dataset, dataset))
  } else {
    const conditions = [
      eq(documents.dataset, dataset),
      isNull(documents.deletedAt)
    ]

    if (perspective === 'published' || perspective === 'previewDrafts') {
      conditions.push(inArray(documents.status, ['draft', 'published']))
    }

    rows = await db.select().from(documents).where(and(...conditions))
  }

  if (perspective === 'raw') {
    const merged = rows.map(mergeDocument)
    cache.set(cacheKey, merged)
    return merged
  }

  const groups = new Map<string, DocumentRow[]>()

  for (const row of rows) {
    const baseId = getBaseId(row)
    if (!groups.has(baseId)) groups.set(baseId, [])
    groups.get(baseId)!.push(row)
  }

  const result: Record<string, unknown>[] = []

  for (const [baseId, group] of groups) {
    if (perspective === 'published') {
      const published = group.filter(r => r.status === 'published')
      if (published.length === 0) continue

      const latest = pickLatest(published)
      if (latest) {
        result.push(toDocumentView(latest, baseId))
      }
    } else {
      const latest = pickLatest(group)
      if (latest) {
        result.push(toDocumentView(latest, baseId))
      }
    }
  }

  cache.set(cacheKey, result)
  return result
}

function getQueryCacheTtlMs(): number {
  const config = useRuntimeConfig()
  const raw = config.groqCacheTtl || process.env.NUXT_GROQ_CACHE_TTL || process.env.GROQ_CACHE_TTL || '0'
  const seconds = Number(raw)
  return Number.isNaN(seconds) || seconds <= 0 ? 0 : seconds * 1000
}

function buildQueryCacheKey(dataset: string, query: string, params: Record<string, unknown>, perspective: GroqPerspective = 'published'): string {
  return `groq:${dataset}:${perspective}:${query}:${JSON.stringify(params)}`
}

export function getCachedQuery(dataset: string, query: string, params: Record<string, unknown>, perspective: GroqPerspective = 'published'): unknown | undefined {
  const ttl = getQueryCacheTtlMs()
  if (ttl <= 0) return undefined

  const key = buildQueryCacheKey(dataset, query, params, perspective)
  const entry = queryCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt < Date.now()) {
    queryCache.delete(key)
    return undefined
  }
  return entry.value
}

export function setCachedQuery(dataset: string, query: string, params: Record<string, unknown>, value: unknown, perspective: GroqPerspective = 'published') {
  const ttl = getQueryCacheTtlMs()
  if (ttl <= 0) return

  const key = buildQueryCacheKey(dataset, query, params, perspective)
  queryCache.set(key, { value, expiresAt: Date.now() + ttl })
}

export function invalidateQueryCache(dataset: string) {
  const prefix = `groq:${dataset}:`
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key)
    }
  }
}
