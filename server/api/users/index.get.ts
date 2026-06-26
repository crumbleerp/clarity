import { useDb } from '../../db'
import { users } from '../../db/schema/users'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user || user.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  return db.select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt }).from(users)
})
