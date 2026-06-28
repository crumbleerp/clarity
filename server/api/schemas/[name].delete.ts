import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { schemas } from '../../db/schema/schemas'
import { requireModeratorOrAbove } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)
  const name = getRouterParam(event, 'name')
  const dataset = getQuery(event).dataset as string || 'production'

  if (!name) {
    throw createError({ statusCode: 400, message: 'Schema name required' })
  }

  const db = useDb()
  await db.delete(schemas).where(and(eq(schemas.name, name), eq(schemas.dataset, dataset)))
  return { success: true }
})
