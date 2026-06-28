import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'
import { requireModeratorOrAbove } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Document ID required' })
  }

  const {
    _type,
    _id,
    _rev,
    _createdAt,
    _updatedAt,
    _originalId,
    _status,
    _publishedAt,
    ...data
  } = body

  const db = useDb()

  const existing = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset), isNull(documents.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  const current = existing[0]!

  if (!current.isRevision) {
    await db.insert(documents).values({
      dataset,
      type: current.type,
      status: current.status,
      publishedAt: current.publishedAt,
      isRevision: true,
      revisionOf: current.id,
      rev: current.rev,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      data: current.data
    })
  }

  const status = _status === 'draft' || _status === 'published' || _status === 'archived'
    ? _status
    : current.status

  const publishedAt = _publishedAt !== undefined
    ? (_publishedAt ? new Date(_publishedAt) : null)
    : (status === 'published' && current.status !== 'published' ? new Date() : current.publishedAt)

  const rows = await db.update(documents)
    .set({
      data,
      status,
      publishedAt,
      updatedAt: new Date(),
      rev: crypto.randomUUID()
    })
    .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
    .returning()

  invalidateCache(dataset)
  return mergeDocument(rows[0]!)
})
