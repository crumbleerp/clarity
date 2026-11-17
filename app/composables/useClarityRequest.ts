import type { $Fetch, FetchOptions } from 'ofetch'

/** Keep dashboard API calls under the configured application base path. */
// Preserve Nuxt's generic call signatures, including method-aware route types.
export const useClarityRequest = ((request: string, options?: FetchOptions) => {
  return ($fetch as $Fetch)(request, { baseURL: useRuntimeConfig().app.baseURL, ...options })
}) as typeof $fetch

export const useClarityData = ((...args: Parameters<typeof useFetch>) => {
  const [request, options] = args
  return useFetch(request, { baseURL: useRuntimeConfig().app.baseURL, ...options })
}) as typeof useFetch
