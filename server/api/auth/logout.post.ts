export default defineEventHandler(async (event) => {
  await logoutUser(event)
  return { success: true }
})
