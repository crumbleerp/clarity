import { useDb } from '../../db'
import { users } from '../../db/schema/users'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const db = useDb()
  return db.select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt }).from(users)
})
