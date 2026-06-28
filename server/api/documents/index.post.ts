import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'
import { requireModeratorOrAbove } from '../../utils/auth'

defineRouteMeta({
  openAPI: {
    tags: ['documents'],
    description: 'Create a new document'
  }
})

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const body = await readBody(event)
  const dataset = getQuery(event).dataset as string || 'production'

  if (!body._type) {
    throw createError({ statusCode: 400, message: '_type is required' })
  }

  const { _type, _id, _status, _publishedAt, ...data } = body

  const status = _status === 'draft' || _status === 'published' || _status === 'archived'
    ? _status
    : 'draft'

  const db = useDb()
  const rows = await db.insert(documents).values({
    id: _id || undefined,
    dataset,
    type: _type,
    status,
    publishedAt: _publishedAt ? new Date(_publishedAt) : status === 'published' ? new Date() : null,
    data
  }).returning()

  invalidateCache(dataset)
  return mergeDocument(rows[0]!)
})
