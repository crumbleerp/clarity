export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  if (!user.value) {
    await fetchUser(headers)
  }

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/dashboard/documents')
  }
})
