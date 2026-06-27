import { useDb } from '../../db'
import { users } from '../../db/schema/users'

export default defineEventHandler(async (event) => {
  requireRoot(event)

  const body = await readBody(event)
  if (!body.username || !body.password || !body.role) {
    throw createError({ statusCode: 400, message: 'username, password and role required' })
  }

  const db = useDb()
  const rows = await db.insert(users).values({
    username: body.username,
    password: body.password,
    role: body.role
  }).returning()

  return rows[0]
})
