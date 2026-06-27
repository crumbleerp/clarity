export { createClient, Client } from './client.js'
export type { Config as ClientConfig, Options as FetchOptions } from './client.js'

export {
  defineField,
  defineType,
  defineI18nField,
  defineThemeField,
  createI18nField,
  createThemeField,
  toClaritySchema
} from './schema.js'
export type {
  ClaritySchema,
  FieldDefinition,
  I18nFieldInput,
  ReferenceType,
  ThemeFieldInput,
  TypeDefinition
} from './schema.js'

export { groq } from './groq.js'
