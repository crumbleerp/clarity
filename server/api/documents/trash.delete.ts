import { eq, and, isNotNull, isNull, sql } from 'drizzle-orm'
import { useDb } from '../../db'
import { documents } from '../../db/schema/documents'
import { invalidateCache } from '../../services/cache'
import { requireRoot } from '../../utils/auth'
import { logger } from '../../utils/logger'
import { stripReferences } from '../../utils/references'

export default defineEventHandler(async (event) => {
  requireRoot(event)
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'

  const db = useDb()

  const trashed = await db.select({ id: documents.id }).from(documents)
    .where(and(
      eq(documents.dataset, dataset),
      isNotNull(documents.deletedAt),
      eq(documents.isRevision, false)
    ))

  const ids = trashed.map(r => r.id)
  if (ids.length === 0) {
    return { deleted: 0 }
  }

  for (const id of ids) {
    const pattern = sql`${documents.data}::text like ${`%"_ref":"${id}"%`}`
    const refs = await db.select().from(documents)
      .where(and(
        eq(documents.dataset, dataset),
        pattern,
        eq(documents.isRevision, false),
        isNull(documents.deletedAt)
      ))

    for (const ref of refs) {
      const stripped = stripReferences(ref.data as Record<string, unknown>, id)
      await db.update(documents)
        .set({ data: stripped, updatedAt: new Date(), rev: crypto.randomUUID() })
        .where(and(eq(documents.id, ref.id), eq(documents.dataset, dataset)))
    }
  }

  await db.delete(documents).where(and(
    eq(documents.dataset, dataset),
    isNotNull(documents.deletedAt)
  ))

  logger.info({ count: ids.length, dataset }, 'Trash emptied')
  invalidateCache(dataset)
  return { deleted: ids.length }
})
