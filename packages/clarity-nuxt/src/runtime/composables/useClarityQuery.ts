import { useAsyncData, useRoute } from 'nuxt/app'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import { toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useClarity } from './useClarity.js'

export function useClarityQuery<T = unknown>(
  query: string,
  params?: MaybeRefOrGetter<Record<string, unknown>>,
  options: AsyncDataOptions<T> = {}
): AsyncData<T, NuxtError<unknown> | undefined> {
  const client = useClarity()
  const route = useRoute()

  const key = `${query}:${route.fullPath}`

  const data = useAsyncData<T>(
    key,
    () => client.fetch<T>(query, toValue(params) ?? {}),
    options
  )

  watch(
    () => toValue(params),
    () => {
      data.refresh()
    },
    { deep: true }
  )

  return data as AsyncData<T, NuxtError<unknown> | undefined>
}
