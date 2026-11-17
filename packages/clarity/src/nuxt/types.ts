import type { Config } from '../client.js'

export interface ClarityNuxtConfig extends Config {
  /**
   * Publish the schema to the Clarity server during module setup.
   * - `true`: always publish
   * - `false`: never publish
   * - `'dev-only'`: publish only during development (default)
   * @default 'dev-only'
   */
  publishSchema?: boolean | 'dev-only'
}
