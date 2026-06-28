import { useDb } from '../../db'
import { datasets } from '../../db/schema/datasets'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const db = useDb()
  const body = await readBody<{ name?: string }>(event)
  const name = body.name?.trim().toLowerCase().replace(/\s+/g, '-')

  if (!name || !/^[a-z0-9_-]+$/.test(name)) {
    throw createError({ statusCode: 400, message: 'Invalid dataset name' })
  }

  try {
    await db.insert(datasets).values({ name }).onConflictDoNothing()
  } catch {
    throw createError({ statusCode: 500, message: 'Failed to create dataset' })
  }

  return { name }
})
