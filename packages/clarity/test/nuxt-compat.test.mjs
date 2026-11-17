import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { loadNuxtModuleInstance } from '@nuxt/kit'
import { createClient } from '@crumbleerp/clarity'
import module, { defineClarityConfig } from '@crumbleerp/clarity/nuxt'

test('preserves the client and Nuxt configuration entry points', () => {
  assert.equal(typeof createClient, 'function')
  assert.equal(typeof module, 'function')
  const config = { endpoint: 'https://cms.example.com', dataset: 'production' }
  assert.equal(defineClarityConfig(config), config)
})

test('Nuxt resolves the original package name to its module', async () => {
  const rootDir = fileURLToPath(new URL('../', import.meta.url))
  const { nuxtModule } = await loadNuxtModuleInstance('@crumbleerp/clarity', {
    options: { rootDir, alias: {}, modulesDir: [rootDir + 'node_modules'] }
  })
  assert.equal(typeof nuxtModule, 'function')
  assert.equal((await nuxtModule.getMeta()).configKey, 'clarity')
})
