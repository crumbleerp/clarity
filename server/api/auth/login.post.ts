import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { users } from '../../db/schema/users'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password required' })
  }

  const db = useDb()
  const rows = await db.select().from(users)
    .where(and(eq(users.username, username), eq(users.password, password)))
    .limit(1)

  if (rows.length === 0) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const user = rows[0]!
  await loginUser(event, user.id, user.role)

  return {
    id: user.id,
    username: user.username,
    role: user.role
  }
})
