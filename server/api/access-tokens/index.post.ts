import { useDb } from '../../db'
import { accessTokens } from '../../db/schema/accessTokens'
import { generateAccessToken, hashAccessToken, getTokenPrefix } from '../../utils/accessToken'

const VALID_ROLES = ['root', 'admin', 'moderator', 'guest']

export default defineEventHandler(async (event) => {
  const currentUser = requireAdminOrRoot(event)

  const body = await readBody(event)
  const name = body.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const role = body.role || 'guest'
  if (!VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, message: 'invalid role' })
  }

  if (currentUser.role === 'admin' && role === 'root') {
    throw createError({ statusCode: 403, message: 'Cannot create root token' })
  }

  let expiresAt: Date | null = null
  if (body.expiresAt) {
    const date = new Date(body.expiresAt)
    if (Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, message: 'invalid expiresAt' })
    }
    expiresAt = date
  }

  const token = generateAccessToken()
  const hash = hashAccessToken(token)
  const prefix = getTokenPrefix(token)

  const db = useDb()
  const rows = await db.insert(accessTokens).values({
    name,
    tokenHash: hash,
    tokenPrefix: prefix,
    role,
    createdBy: currentUser.isToken ? null : currentUser.id,
    ...(expiresAt && { expiresAt })
  }).returning()

  const record = rows[0]!

  return {
    token,
    id: record.id,
    name: record.name,
    role: record.role,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt
  }
})
