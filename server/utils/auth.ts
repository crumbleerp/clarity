import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb } from '../db'
import { users } from '../db/schema/users'
import { verifyAccessToken } from './accessToken'

const SESSION_CONFIG = {
  password: '',
  maxAge: 60 * 60 * 24 * 7,
  cookie: { secure: !import.meta.dev }
}

export type UserRole = 'root' | 'admin' | 'moderator' | 'guest'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  isToken?: boolean
}

function getSessionConfig() {
  const config = useRuntimeConfig()
  return { ...SESSION_CONFIG, password: config.sessionSecret }
}

export async function getSessionData(event: H3Event) {
  const session = await useSession(event, getSessionConfig())
  return session
}

export async function authenticateUser(event: H3Event) {
  const session = await getSessionData(event)
  const userId = session.data.userId as string | undefined
  if (!userId) return null

  const db = useDb()
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return rows[0] || null
}

export async function loginUser(event: H3Event, userId: string, role: string) {
  const session = await getSessionData(event)
  await session.update({ userId, role })
}

export async function logoutUser(event: H3Event) {
  const session = await getSessionData(event)
  await session.clear()
}

export async function resolveAuthUser(event: H3Event): Promise<AuthUser | null> {
  const sessionUser = await authenticateUser(event)
  if (sessionUser) {
    return { id: sessionUser.id, username: sessionUser.username, role: sessionUser.role }
  }

  const tokenUser = await verifyAccessToken(event)
  if (tokenUser) {
    return { id: tokenUser.id, username: tokenUser.name, role: tokenUser.role as UserRole, isToken: true }
  }

  return null
}

export function requireUser(event: H3Event): AuthUser {
  const user = event.context.user as AuthUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  return user
}

export function requireRoot(event: H3Event): AuthUser {
  const user = requireUser(event)
  if (user.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

export function requireAdminOrRoot(event: H3Event): AuthUser {
  const user = requireUser(event)
  if (user.role !== 'admin' && user.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

export function isAdminOrRoot(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'root'
}

export function requireModeratorOrAbove(event: H3Event): AuthUser {
  const user = requireUser(event)
  if (user.role !== 'moderator' && user.role !== 'admin' && user.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

export function requireEditor(event: H3Event): AuthUser {
  return requireModeratorOrAbove(event)
}

export function isReadOnly(user: AuthUser): boolean {
  return user.role === 'guest'
}

export function canManageUsers(current: AuthUser): boolean {
  return current.role === 'admin' || current.role === 'root'
}

export function canCreateUser(current: AuthUser, targetRole: UserRole): boolean {
  if (current.role === 'root') return true
  if (current.role === 'admin') return targetRole === 'guest' || targetRole === 'moderator'
  return false
}

export function canUpdateUser(current: AuthUser, target: { role: UserRole, id: string }): boolean {
  if (current.role === 'root') return true
  if (current.role !== 'admin') return false
  if (target.role === 'root') return false
  return target.role === 'guest' || target.role === 'moderator'
}
