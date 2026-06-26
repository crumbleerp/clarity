import { eq, and, inArray, ne, count, sql } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

const ASSET_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function getDimensions(data: Record<string, unknown>) {
  const metadata = data.metadata as Record<string, unknown> | undefined
  const dimensions = metadata?.dimensions as Record<string, unknown> | undefined
  const width = getNumber(dimensions?.width)
  const height = getNumber(dimensions?.height)
  return width && height ? { width, height } : undefined
}

function formatBytes(bytes?: number) {
  if (bytes == null) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'kB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const type = query.type as string | undefined
  const search = (query.search as string) || ''
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const db = useDb()
  const conditions = [
    eq(documents.dataset, dataset),
    inArray(documents.type, ASSET_TYPES)
  ]

  if (type && ASSET_TYPES.includes(type)) {
    conditions.push(eq(documents.type, type))
  }

  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`
    conditions.push(sql`lower(${documents.data}::text) like ${term}`)
  }

  const where = and(...conditions)

  const [rows, totalRows] = await Promise.all([
    db.select().from(documents).where(where).orderBy(documents.updatedAt).limit(limit).offset(offset),
    db.select({ count: count() }).from(documents).where(where)
  ])

  const assets = await Promise.all(rows.map(async (row) => {
    const doc = mergeDocument(row)
    const data = doc as Record<string, unknown>
    const dimensions = getDimensions(data)

    const refsResult = await db.select({ count: count() })
      .from(documents)
      .where(and(
        eq(documents.dataset, dataset),
        ne(documents.id, row.id),
        sql`${documents.data}::text like ${`%"_ref":"${row.id}"%`}`
      ))

    const refs = refsResult[0]?.count ?? 0
    const size = getNumber(data.size)
    const filename = getString(data.originalFilename) || getString(data.assetId) || String(doc._id)

    return {
      ...doc,
      _filename: filename,
      _resolution: dimensions
        ? `${dimensions.width}×${dimensions.height}px`
        : '-',
      _references: refs,
      _sizeLabel: formatBytes(size)
    }
  }))

  return {
    assets,
    total: totalRows[0]?.count || 0,
    limit,
    offset
  }
})
