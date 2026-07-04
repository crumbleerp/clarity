import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'
import { createClient } from '@crumbleerp/clarity'
import type { ClarityNuxtConfig } from '../../types.js'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = runtimeConfig.public.clarity as ClarityNuxtConfig
  const privateConfig = runtimeConfig.clarity as { token?: string } | undefined

  const client = createClient({
    ...publicConfig,
    token: privateConfig?.token ?? publicConfig.token
  })

  return {
    provide: {
      clarity: client
    }
  }
})
