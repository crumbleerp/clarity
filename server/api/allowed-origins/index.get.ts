import { useDb } from '../../db'
import { allowedOrigins } from '../../db/schema/allowedOrigins'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const db = useDb()
  return db.select({
    id: allowedOrigins.id,
    origin: allowedOrigins.origin,
    createdAt: allowedOrigins.createdAt
  }).from(allowedOrigins).orderBy(allowedOrigins.createdAt)
})
