import { useDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user || user.role !== 'root') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDb()
  await db.execute('TRUNCATE TABLE documents, schemas RESTART IDENTITY CASCADE')

  const { invalidateCache } = await import('../../services/cache')
  invalidateCache('production')

  return { success: true }
})
