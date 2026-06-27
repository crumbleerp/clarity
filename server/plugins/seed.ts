import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { users } from '../db/schema/users'
import { datasets } from '../db/schema/datasets'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const db = useDb()

  const username = config.rootUsername || 'admin'
  const password = config.rootPassword || 'admin'

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1)

  if (existing.length === 0) {
    await db.insert(users).values({
      username,
      password,
      role: 'root'
    })
    console.log(`[clarity] Root user "${username}" created`)
  }

  try {
    await db.insert(datasets).values({ name: 'production' }).onConflictDoNothing()
  } catch {
    // datasets table may not exist yet during prerender
  }
})
