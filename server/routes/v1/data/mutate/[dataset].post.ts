import { eq, and } from 'drizzle-orm'
import { useDb } from '../../../../db'
import { documents } from '../../../../db/schema/documents'
import { invalidateCache } from '../../../../services/cache'

interface Mutation {
  create?: Record<string, unknown>
  createIfNotExists?: Record<string, unknown>
  createOrReplace?: Record<string, unknown>
  patch?: { id: string, set?: Record<string, unknown>, unset?: string[] }
  delete?: { id: string }
}

export default defineEventHandler(async (event) => {
  const dataset = getRouterParam(event, 'dataset')
  const body = await readBody(event)

  if (!dataset) {
    throw createError({ statusCode: 400, message: 'Dataset required' })
  }

  if (!body.mutations || !Array.isArray(body.mutations)) {
    throw createError({ statusCode: 400, message: 'mutations array required' })
  }

  const db = useDb()
  const results: { id: string, operation: string }[] = []

  for (const mutation of body.mutations as Mutation[]) {
    if (mutation.create) {
      const { _type, _id, ...data } = mutation.create
      if (!_type) throw createError({ statusCode: 400, message: '_type required for create' })

      const rows = await db.insert(documents).values({
        id: _id as string || undefined,
        dataset,
        type: _type as string,
        data
      }).returning()
      results.push({ id: rows[0]!.id, operation: 'create' })
    }

    if (mutation.createIfNotExists) {
      const { _type, _id, ...data } = mutation.createIfNotExists
      if (!_id || !_type) throw createError({ statusCode: 400, message: '_id and _type required for createIfNotExists' })

      const existing = await db.select().from(documents)
        .where(and(eq(documents.id, _id as string), eq(documents.dataset, dataset)))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(documents).values({
          id: _id as string,
          dataset,
          type: _type as string,
          data
        })
        results.push({ id: _id as string, operation: 'create' })
      } else {
        results.push({ id: _id as string, operation: 'noop' })
      }
    }

    if (mutation.createOrReplace) {
      const { _type, _id, ...data } = mutation.createOrReplace
      if (!_id || !_type) throw createError({ statusCode: 400, message: '_id and _type required for createOrReplace' })

      await db.delete(documents)
        .where(and(eq(documents.id, _id as string), eq(documents.dataset, dataset)))

      await db.insert(documents).values({
        id: _id as string,
        dataset,
        type: _type as string,
        data
      })
      results.push({ id: _id as string, operation: 'create' })
    }

    if (mutation.patch) {
      const { id, set, unset } = mutation.patch
      if (!id) throw createError({ statusCode: 400, message: 'id required for patch' })

      const existing = await db.select().from(documents)
        .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
        .limit(1)

      if (existing.length === 0) {
        throw createError({ statusCode: 404, message: `Document ${id} not found` })
      }

      const currentData = (existing[0]!.data || {}) as Record<string, unknown>
      const newData = { ...currentData }

      if (set) {
        Object.assign(newData, set)
      }
      if (unset) {
        const keysToUnset = new Set(unset)
        Object.keys(newData).forEach((k) => {
          if (keysToUnset.has(k)) Reflect.deleteProperty(newData, k)
        })
      }

      await db.update(documents)
        .set({ data: newData, updatedAt: new Date(), rev: crypto.randomUUID() })
        .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))

      results.push({ id, operation: 'update' })
    }

    if (mutation.delete) {
      const { id } = mutation.delete
      if (!id) throw createError({ statusCode: 400, message: 'id required for delete' })

      await db.delete(documents)
        .where(and(eq(documents.id, id), eq(documents.dataset, dataset)))
      results.push({ id, operation: 'delete' })
    }
  }

  invalidateCache(dataset)

  return {
    results,
    transactionId: crypto.randomUUID()
  }
})
