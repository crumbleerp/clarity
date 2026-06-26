import { getSchemas } from '../../services/schema'

export default defineEventHandler(async (event) => {
  const dataset = getQuery(event).dataset as string || 'production'
  return getSchemas(dataset)
})
