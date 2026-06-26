export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth()
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  await fetchUser(headers)
})
