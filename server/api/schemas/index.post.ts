import { upsertSchema } from '../../services/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Expected array of schemas' })
  }

  const dataset = getQuery(event).dataset as string || 'production'
  const results = []

  for (const item of body) {
    if (!item.name || !item.title || !item.fields) {
      throw createError({ statusCode: 400, message: 'Each schema must have name, title, fields' })
    }
    const result = await upsertSchema({
      name: item.name,
      title: item.title,
      schemaType: item.type || 'document',
      fields: item.fields,
      dataset
    })
    results.push(result)
  }

  return results
})
