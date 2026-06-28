import { loadCache, getCachedQuery, setCachedQuery, type GroqPerspective } from '../../../../services/cache'
import { executeQuery, GroqQueryError } from '../../../../services/groq'

defineRouteMeta({
  openAPI: {
    tags: ['v1'],
    description: 'Execute a GROQ query against a dataset',
    parameters: [
      { in: 'query', name: 'query', required: true, schema: { type: 'string' } },
      { in: 'query', name: 'params', schema: { type: 'string' } }
    ]
  }
})

export default defineEventHandler(async (event) => {
  const dataset = getRouterParam(event, 'dataset')
  const queryParam = getQuery(event)
  const query = queryParam.query as string
  const rawParams = queryParam.params as string | undefined
  const perspective = (queryParam.perspective as GroqPerspective) || 'published'

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

  const cached = getCachedQuery(dataset, query, params, perspective)
  if (cached !== undefined) {
    return { ms: Date.now(), query, result: cached, cached: true }
  }

  const data = await loadCache(dataset, perspective)

  try {
    const result = await executeQuery(query, data, params)
    setCachedQuery(dataset, query, params, result, perspective)
    return {
      ms: Date.now(),
      query,
      result,
      cached: false
    }
  } catch (err) {
    if (err instanceof GroqQueryError) {
      throw createError({ statusCode: 400, message: err.message })
    }
    throw err
  }
})
