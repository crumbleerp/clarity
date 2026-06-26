import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { jobs } from '../db/schema/jobs'

export async function createJob(payload: Record<string, string>) {
  const db = useDb()
  const rows = await db.insert(jobs).values({
    type: 'import',
    payload: JSON.stringify(payload),
    status: 'pending',
    logs: '[]'
  }).returning()
  return rows[0]!.id
}

export async function getJob(id: string) {
  const db = useDb()
  const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
  return rows[0] || null
}

export async function updateJob(
  id: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  result?: Record<string, unknown> | null,
  error?: string
) {
  const db = useDb()
  await db.update(jobs)
    .set({
      status,
      result: result ? JSON.stringify(result) : null,
      error,
      updatedAt: new Date()
    })
    .where(eq(jobs.id, id))
}

export async function addJobLog(id: string, message: string) {
  const db = useDb()
  const rows = await db.select({ logs: jobs.logs }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (rows.length === 0) return

  const existing = JSON.parse(rows[0]!.logs || '[]') as string[]
  const timestamp = new Date().toISOString()
  const updated = [...existing, `[${timestamp}] ${message}`]

  await db.update(jobs)
    .set({ logs: JSON.stringify(updated), updatedAt: new Date() })
    .where(eq(jobs.id, id))
}
