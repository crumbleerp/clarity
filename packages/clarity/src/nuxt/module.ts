import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  addImports,
  addImportsDir,
  addPlugin,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  logger
} from '@nuxt/kit'
import { createClient } from '../client.js'
import { generateSchemaTypes } from '../schema-types.js'
import type { ClarityNuxtConfig } from './types.js'

export default defineNuxtModule<ClarityNuxtConfig>({
  meta: {
    name: 'clarity',
    configKey: 'clarity',
    compatibility: {
      nuxt: '>=4.0.0'
    }
  },
  defaults: {
    dataset: 'production',
    version: '1',
    publishSchema: 'dev-only'
  },
  async setup(moduleOptions, nuxt) {
    const resolver = createResolver(import.meta.url)

    const config = await resolveClarityConfig(nuxt.options.rootDir, moduleOptions)

    nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {}
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.clarity = {
      ...(nuxt.options.runtimeConfig.clarity as object || {}),
      token: config.token
    }
    nuxt.options.runtimeConfig.public.clarity = {
      endpoint: config.endpoint,
      dataset: config.dataset,
      version: config.version,
      schema: config.schema
    }

    addPlugin(resolver.resolve('./runtime/plugins/clarity.js'))
    addImportsDir(resolver.resolve('./runtime/composables'))
    addImports([{
      name: 'groq',
      as: 'groq',
      from: resolver.resolve('../groq.js')
    }])

    if (config.schema) {
      addTypeTemplate({
        filename: 'types/clarity.d.ts',
        getContents: () => generateSchemaTypes(config.schema!)
      })
    }

    const shouldPublish = config.publishSchema === true
      || (config.publishSchema === 'dev-only' && !nuxt.options._prepare)

    if (shouldPublish && config.endpoint) {
      try {
        const client = createClient({
          endpoint: config.endpoint,
          dataset: config.dataset,
          version: config.version,
          token: config.token,
          schema: config.schema
        })
        await client.syncSchema()
        logger.success('[clarity] Schema published')
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.warn(`[clarity] Failed to publish schema: ${message}`)
      }
    }
  }
})

async function resolveClarityConfig(
  rootDir: string,
  moduleOptions: ClarityNuxtConfig
): Promise<ClarityNuxtConfig> {
  const configPath = resolve(rootDir, 'clarity.config.ts')

  if (existsSync(configPath)) {
    try {
      const mod = await import(configPath)
      const exported = mod.default || mod

      if (typeof exported === 'function') {
        return { ...moduleOptions, ...exported() }
      }

      return { ...moduleOptions, ...exported }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn(`[clarity] Failed to load clarity.config.ts: ${message}`)
    }
  }

  return moduleOptions
}
