import type { UseFetchOptions } from 'nuxt/app'

/** Keep dashboard API calls under the configured application base path. */
export function useClarityRequest<T = unknown>(request: string, options?: Parameters<typeof $fetch>[1]) {
  return $fetch<T>(request, { baseURL: useRuntimeConfig().app.baseURL, ...options })
}

export function useClarityData<T = unknown>(request: string, options?: UseFetchOptions<T>) {
  return useFetch<T>(request, { baseURL: useRuntimeConfig().app.baseURL, ...options })
}
