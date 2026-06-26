export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role
  }
})
