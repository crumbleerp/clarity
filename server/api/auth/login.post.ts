import { eq, and } from 'drizzle-orm'
import { useDb } from '../../db'
import { users } from '../../db/schema/users'
import { rateLimit } from '../../utils/rateLimit'

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Authenticate with username and password',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' }
            },
            required: ['username', 'password']
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const limit = rateLimit(event, { max: 5, windowMs: 60 * 1000, prefix: 'login' })
  if (!limit.allowed) {
    throw createError({ statusCode: 429, message: 'Too many login attempts. Try again later.' })
  }

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
