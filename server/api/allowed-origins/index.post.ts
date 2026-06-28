import { useDb } from '../../db'
import { allowedOrigins } from '../../db/schema/allowedOrigins'
import { invalidateAllowedOriginsCache } from '../../services/allowedOrigins'

function normalizeOrigin(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    return url.origin
  } catch {
    return trimmed
  }
}

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const body = await readBody(event)
  const origin = normalizeOrigin(body.origin)
  if (!origin) {
    throw createError({ statusCode: 400, message: 'origin is required' })
  }

  const db = useDb()
  try {
    const rows = await db.insert(allowedOrigins).values({ origin }).returning()
    invalidateAllowedOriginsCache()
    return rows[0]
  } catch {
    throw createError({ statusCode: 409, message: 'Origin already exists' })
  }
})
