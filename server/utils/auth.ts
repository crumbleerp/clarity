import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { users } from '../db/schema/users'

const SESSION_CONFIG = {
  password: '',
  maxAge: 60 * 60 * 24 * 7,
  cookie: { secure: !import.meta.dev }
}

function getSessionConfig() {
  const config = useRuntimeConfig()
  return { ...SESSION_CONFIG, password: config.sessionSecret }
}

export async function getSessionData(event: import('h3').H3Event) {
  const session = await useSession(event, getSessionConfig())
  return session
}

export async function authenticateUser(event: import('h3').H3Event) {
  const session = await getSessionData(event)
  const userId = session.data.userId as string | undefined
  if (!userId) return null

  const db = useDb()
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return rows[0] || null
}

export async function loginUser(event: import('h3').H3Event, userId: string, role: string) {
  const session = await getSessionData(event)
  await session.update({ userId, role })
}

export async function logoutUser(event: import('h3').H3Event) {
  const session = await getSessionData(event)
  await session.clear()
}
