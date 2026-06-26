import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as datasets from './schema/datasets'
import * as documents from './schema/documents'
import * as schemas from './schema/schemas'
import * as users from './schema/users'
import * as jobs from './schema/jobs'

const schema = { ...datasets, ...documents, ...schemas, ...users, ...jobs }

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (!_db) {
    const config = useRuntimeConfig()
    const url = config.databaseUrl || process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/clarity'
    const client = postgres(url)
    _db = drizzle(client, { schema })
  }
  return _db
}
