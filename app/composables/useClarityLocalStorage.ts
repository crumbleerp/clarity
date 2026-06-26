export function useClarityLocalStorage<T>(key: string, initial: T) {
  const value = ref<T>(initial)

  function read() {
    if (!import.meta.client) return
    try {
      const item = localStorage.getItem(key)
      if (item) value.value = JSON.parse(item)
    } catch {
      // ignore parse errors
    }
  }

  function write() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(key, JSON.stringify(value.value))
    } catch {
      // ignore storage errors
    }
  }

  onMounted(read)
  watch(() => value.value, write, { deep: true, immediate: false })

  return value
}
