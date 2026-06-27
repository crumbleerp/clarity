import { useNuxtApp } from 'nuxt/app'
import type { Client } from '../../../client.js'

export function useClarity(): Client {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$clarity as Client | undefined

  if (!client) {
    throw new Error('[clarity] Client not found. Is the Clarity Nuxt module installed?')
  }

  return client
}
