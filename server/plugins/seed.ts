import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { users } from '../db/schema/users'
import { datasets } from '../db/schema/datasets'
import { logger } from '../utils/logger'

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
    logger.info(`Root user "${username}" created`)
  }

  const defaultDataset = (config.public?.dataset as string | undefined) || 'production'

  try {
    const existingDatasets = await db.select({ name: datasets.name }).from(datasets).limit(1)
    if (existingDatasets.length === 0) {
      await db.insert(datasets).values({ name: defaultDataset }).onConflictDoNothing()
      logger.info(`Default dataset "${defaultDataset}" created`)
    }
  } catch {
    // datasets table may not exist yet during prerender
  }
})
