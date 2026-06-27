import { eq } from 'drizzle-orm'
import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { useDb } from '../db'
import { accessTokens } from '../db/schema/accessTokens'

const TOKEN_PREFIX = 'sk-clarity-'
const TOKEN_RANDOM_BYTES = 32

export function generateAccessToken(): string {
  const random = randomBytes(TOKEN_RANDOM_BYTES).toString('hex')
  return `${TOKEN_PREFIX}${random}`
}

export function hashAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getTokenPrefix(token: string): string {
  const visible = token.slice(0, 24)
  return `${visible}...`
}

export async function verifyAccessToken(event: H3Event): Promise<{ id: string, name: string, role: string } | null> {
  const header = getHeader(event, 'authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1]
  if (!token?.startsWith(TOKEN_PREFIX)) return null

  const hash = hashAccessToken(token)
  const db = useDb()
  const rows = await db.select().from(accessTokens).where(eq(accessTokens.tokenHash, hash)).limit(1)
  const record = rows[0]

  if (!record) return null
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) return null

  return {
    id: record.id,
    name: record.name,
    role: record.role
  }
}
