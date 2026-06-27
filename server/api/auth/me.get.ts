export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  return {
    id: user.id,
    username: user.username,
    role: user.role
  }
})
