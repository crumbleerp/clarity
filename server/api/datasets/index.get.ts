import { useDb } from '../../db'
import { datasets } from '../../db/schema/datasets'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const rows = await db.select({ name: datasets.name })
    .from(datasets)
    .orderBy(sql`${datasets.name} ASC`)

  return {
    datasets: rows.map(row => row.name)
  }
})
