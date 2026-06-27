export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  const publicPaths = ['/api/auth/login', '/api/auth/logout', '/v1/data/query']
  if (publicPaths.some(p => url.pathname === p || url.pathname.startsWith(p))) {
    return
  }

  const protectedPaths = ['/api/', '/v1/data/mutate']
  if (!protectedPaths.some(p => url.pathname.startsWith(p))) {
    return
  }

  const user = await resolveAuthUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  event.context.user = user
})
