import { useRuntimeConfig } from 'nuxt/app'
import type { ClarityNuxtConfig } from '../../types.js'

export function useClarityConfig(): ClarityNuxtConfig {
  return useRuntimeConfig().public.clarity as ClarityNuxtConfig
}
