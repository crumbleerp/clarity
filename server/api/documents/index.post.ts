import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'
import { invalidateCache } from '../../services/cache'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const dataset = getQuery(event).dataset as string || 'production'

  if (!body._type) {
    throw createError({ statusCode: 400, message: '_type is required' })
  }

  const { _type, _id, ...data } = body

  const db = useDb()
  const rows = await db.insert(documents).values({
    id: _id || undefined,
    dataset,
    type: _type,
    data
  }).returning()

  invalidateCache(dataset)
  return mergeDocument(rows[0]!)
})
