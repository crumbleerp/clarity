import { getAllowedOrigins } from '../services/allowedOrigins'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/v1/data/')) {
    return
  }

  const allowed = await getAllowedOrigins()
  const origin = getHeader(event, 'origin')

  if (allowed.has('*')) {
    setHeader(event, 'Access-Control-Allow-Origin', origin || '*')
  } else if (origin && allowed.has(origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
  }

  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  setHeader(event, 'Access-Control-Allow-Credentials', 'true')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
