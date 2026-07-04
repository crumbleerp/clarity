import { getSchemas } from '../../services/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const includeSystem = query.includeSystem === 'true'

  const schemas = await getSchemas(dataset)

  if (includeSystem) {
    return schemas
  }

  return schemas.filter(schema => !schema.name.startsWith('_clarity'))
})
