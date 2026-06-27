import { eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { accessTokens } from '../../db/schema/accessTokens'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Token ID required' })
  }

  const db = useDb()
  await db.delete(accessTokens).where(eq(accessTokens.id, id))

  return { success: true }
})
