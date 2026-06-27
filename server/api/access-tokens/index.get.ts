import { desc } from 'drizzle-orm'
import { useDb } from '../../db'
import { accessTokens } from '../../db/schema/accessTokens'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const db = useDb()
  return db.select({
    id: accessTokens.id,
    name: accessTokens.name,
    tokenPrefix: accessTokens.tokenPrefix,
    role: accessTokens.role,
    expiresAt: accessTokens.expiresAt,
    createdAt: accessTokens.createdAt,
    updatedAt: accessTokens.updatedAt
  }).from(accessTokens).orderBy(desc(accessTokens.createdAt))
})
