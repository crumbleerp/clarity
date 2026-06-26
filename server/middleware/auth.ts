export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const protectedPaths = ['/api/documents', '/api/schemas', '/api/media']

  if (!protectedPaths.some(p => url.pathname.startsWith(p))) {
    return
  }

  const user = await authenticateUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  event.context.user = user
})
