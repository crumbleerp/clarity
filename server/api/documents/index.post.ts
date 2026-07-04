import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'
import { requireModeratorOrAbove } from '../../utils/auth'
import { getSchema } from '../../services/schema'
import { validateDocument, type FieldDef } from '../../services/validation'

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

  const schema = await getSchema(_type as string, dataset)
  if (schema?.fields) {
    const errors = validateDocument(data, schema.fields as FieldDef[])
    if (errors.length > 0) {
      throw createError({ statusCode: 400, message: 'Validation failed', data: { errors } })
    }
  }

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
