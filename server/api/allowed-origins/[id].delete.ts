import { eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { allowedOrigins } from '../../db/schema/allowedOrigins'
import { invalidateAllowedOriginsCache } from '../../services/allowedOrigins'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Origin ID required' })
  }

  const db = useDb()
  await db.delete(allowedOrigins).where(eq(allowedOrigins.id, id))
  invalidateAllowedOriginsCache()

  return { success: true }
})
