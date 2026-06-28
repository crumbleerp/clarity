import { useDb } from '../db'

defineRouteMeta({
  openAPI: {
    tags: ['system'],
    description: 'Health check endpoint',
    responses: {
      200: { description: 'Service is healthy' },
      503: { description: 'Database unavailable' }
    }
  }
})

export default defineEventHandler(async (_event) => {
  const db = useDb()

  try {
    await db.execute('select 1')
    return { status: 'ok', database: 'ok', timestamp: new Date().toISOString() }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 503, statusMessage: `Database unavailable: ${message}` })
  }
})
