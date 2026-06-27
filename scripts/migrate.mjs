import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL

if (!url) {
  console.warn('[migrate] NUXT_DATABASE_URL or DATABASE_URL not set, skipping migrations')
  process.exit(0)
}

const client = postgres(url, { max: 1 })
const db = drizzle(client)

try {
  await migrate(db, { migrationsFolder: '/app/migrations' })
  console.log('[migrate] migrations applied')
} catch (error) {
  console.error('[migrate] failed to apply migrations', error)
  process.exit(1)
} finally {
  await client.end()
}
