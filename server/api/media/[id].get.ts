import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { mergeDocument } from '../../utils/merge'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!id) {
    throw createError({ statusCode: 400, message: 'Asset ID required' })
  }

  const db = useDb()
  const rows = await db.select().from(documents)
    .where(and(
      eq(documents.id, id),
      eq(documents.dataset, dataset),
      eq(documents.type, 'sanity.imageAsset')
    ))
    .limit(1)

  const fileRows = rows.length === 0
    ? await db.select().from(documents).where(and(
        eq(documents.id, id),
        eq(documents.dataset, dataset),
        eq(documents.type, 'sanity.fileAsset')
      )).limit(1)
    : []

  const found = rows[0] || fileRows[0]

  if (!found) {
    throw createError({ statusCode: 404, message: 'Asset not found' })
  }

  return mergeDocument(found)
})
