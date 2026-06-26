import { loadCache } from '../../../../services/cache'
import { executeQuery, GroqQueryError } from '../../../../services/groq'

export default defineEventHandler(async (event) => {
  const dataset = getRouterParam(event, 'dataset')
  const queryParam = getQuery(event)
  const query = queryParam.query as string
  const rawParams = queryParam.params as string | undefined

  if (!dataset) {
    throw createError({ statusCode: 400, message: 'Dataset required' })
  }

  if (!query) {
    throw createError({ statusCode: 400, message: 'query parameter required' })
  }

  const params: Record<string, unknown> = {}
  if (rawParams) {
    try {
      Object.assign(params, JSON.parse(rawParams))
    } catch {
      throw createError({ statusCode: 400, message: 'Invalid params JSON' })
    }
  }

  const data = await loadCache(dataset)

  try {
    const result = await executeQuery(query, data, params)
    return {
      ms: Date.now(),
      query,
      result
    }
  } catch (err) {
    if (err instanceof GroqQueryError) {
      throw createError({ statusCode: 400, message: err.message })
    }
    throw err
  }
})
