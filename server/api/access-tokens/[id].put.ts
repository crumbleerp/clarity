import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../db'
import { accessTokens } from '../../db/schema/accessTokens'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Token ID required' })
  }

  const body = await readBody(event)
  const db = useDb()

  const existing = await db.select().from(accessTokens).where(eq(accessTokens.id, id)).limit(1)
  if (existing.length === 0) {
    throw createError({ statusCode: 404, message: 'Token not found' })
  }

  let expiresAt: Date | undefined
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null) {
      expiresAt = undefined
    } else {
      const date = new Date(body.expiresAt)
      if (Number.isNaN(date.getTime())) {
        throw createError({ statusCode: 400, message: 'invalid expiresAt' })
      }
      expiresAt = date
    }
  }

  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) set.name = body.name.trim()
  if (expiresAt !== undefined) set.expiresAt = expiresAt
  if (body.expiresAt === null) set.expiresAt = sql`NULL`

  const rows = await db.update(accessTokens)
    .set(set)
    .where(eq(accessTokens.id, id))
    .returning()

  return rows[0]
})
