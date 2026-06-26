import { eq, and } from 'drizzle-orm'
import { useDb } from '../db'
import { schemas } from '../db/schema/schemas'

export async function getSchemas(dataset: string) {
  const db = useDb()
  return db.select().from(schemas).where(eq(schemas.dataset, dataset))
}

export async function getSchema(name: string, dataset: string) {
  const db = useDb()
  const rows = await db.select().from(schemas)
    .where(and(eq(schemas.name, name), eq(schemas.dataset, dataset)))
    .limit(1)
  return rows[0] || null
}

export async function upsertSchema(input: {
  name: string
  title: string
  schemaType?: string
  fields: unknown[]
  dataset: string
}) {
  const db = useDb()
  const existing = await getSchema(input.name, input.dataset)

  if (existing) {
    await db.update(schemas)
      .set({
        title: input.title,
        schemaType: input.schemaType || 'document',
        fields: input.fields,
        updatedAt: new Date()
      })
      .where(and(eq(schemas.name, input.name), eq(schemas.dataset, input.dataset)))
    return { ...existing, ...input, updatedAt: new Date() }
  }

  const rows = await db.insert(schemas).values({
    name: input.name,
    title: input.title,
    schemaType: input.schemaType || 'document',
    fields: input.fields,
    dataset: input.dataset
  }).returning()
  return rows[0]
}

export async function deleteSchema(name: string, dataset: string) {
  const db = useDb()
  await db.delete(schemas).where(and(eq(schemas.name, name), eq(schemas.dataset, dataset)))
}
