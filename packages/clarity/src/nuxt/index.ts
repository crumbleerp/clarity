import module from './module.js'

export { module as default }

export { generateSchemaTypes } from '../schema-types.js'
export { groq } from '../groq.js'

export type { ClarityNuxtConfig } from './types.js'

export function defineClarityConfig(config: import('./types.js').ClarityNuxtConfig): import('./types.js').ClarityNuxtConfig {
  return config
}
