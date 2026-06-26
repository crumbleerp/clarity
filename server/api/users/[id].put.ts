import { eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { users } from '../../db/schema/users'

export default defineEventHandler(async (event) => {
  const currentUser = await authenticateUser(event)
  if (!currentUser || currentUser.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'User ID required' })
  }

  const body = await readBody(event)
  const db = useDb()

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (existing.length === 0) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (existing[0]!.role === 'root' && body.role && body.role !== 'root') {
    throw createError({ statusCode: 400, message: 'Cannot change root user role' })
  }

  const rows = await db.update(users)
    .set({
      ...(body.username && { username: body.username }),
      ...(body.password && { password: body.password }),
      ...(body.role && { role: body.role as 'root' | 'admin' | 'moderator' | 'guest' })
    })
    .where(eq(users.id, id))
    .returning()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return rows[0]
})
