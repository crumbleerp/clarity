export function useAuth() {
  const user = useState<{ id: string, username: string, role: string } | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => false)

  async function fetchUser(headers?: Record<string, string>) {
    try {
      const data = await $fetch('/api/auth/me', { headers })
      user.value = data as { id: string, username: string, role: string }
    } catch {
      user.value = null
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      user.value = data as { id: string, username: string, role: string }
      return true
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, loading, fetchUser, login, logout }
}
