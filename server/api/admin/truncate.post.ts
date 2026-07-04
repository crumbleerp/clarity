import { useDb } from '../../db'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const db = useDb()
  await db.execute('TRUNCATE TABLE documents, schemas RESTART IDENTITY CASCADE')

  const { invalidateCache } = await import('../../services/cache')
  invalidateCache('production')

  return { success: true }
})
