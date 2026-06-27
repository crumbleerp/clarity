export type ClarityFieldType
  = | 'string'
    | 'text'
    | 'markdown'
    | 'html'
    | 'number'
    | 'boolean'
    | 'color'
    | 'date'
    | 'datetime'
    | 'url'
    | 'email'
    | 'slug'
    | 'reference'
    | 'image'
    | 'file'
    | 'object'
    | 'document'
    | 'array'

export type ClarityTypeType = 'document' | 'object'

export interface FieldDefinition {
  name: string
  title?: string
  type: ClarityFieldType
  description?: string
  options?: Record<string, unknown>
  fields?: FieldDefinition[]
  of?: (FieldDefinition | ReferenceType)[]
  to?: Array<{ type: string }>
  validation?: unknown
  [key: string]: unknown
}

export interface ReferenceType {
  type: 'reference'
  to: Array<{ type: string }>
}

export interface TypeDefinition {
  name: string
  title?: string
  type: ClarityTypeType
  description?: string
  fields?: FieldDefinition[]
  options?: Record<string, unknown>
  [key: string]: unknown
}

export interface ClaritySchema {
  name: string
  title: string
  schemaType: string
  fields: FieldDefinition[]
  [key: string]: unknown
}

export function defineField<T extends FieldDefinition>(def: T): T {
  return def
}

export function defineType<T extends TypeDefinition>(def: T): T {
  return def
}

export interface I18nFieldInput {
  name: string
  title?: string
  type: ClarityFieldType
  description?: string
  options?: Record<string, unknown>
  validation?: unknown
}

export interface ThemeFieldInput {
  name: string
  title?: string
  type: ClarityFieldType
  description?: string
  options?: Record<string, unknown>
  validation?: unknown
}

export function defineI18nField(
  def: I18nFieldInput,
  locales: string[] = ['en']
): FieldDefinition {
  return defineField({
    ...def,
    type: 'object',
    fields: locales.map(locale =>
      defineField({
        name: locale,
        title: locale.toUpperCase(),
        type: def.type
      })
    )
  })
}

export function defineThemeField(
  def: ThemeFieldInput,
  themes: string[] = ['light', 'dark']
): FieldDefinition {
  return defineField({
    ...def,
    type: 'object',
    fields: themes.map(theme =>
      defineField({
        name: theme,
        title: theme,
        type: def.type
      })
    )
  })
}

export function createI18nField(locales: string[]) {
  return (def: I18nFieldInput) => defineI18nField(def, locales)
}

export function createThemeField(themes: string[]) {
  return (def: ThemeFieldInput) => defineThemeField(def, themes)
}

export function toClaritySchema(def: TypeDefinition): ClaritySchema {
  return {
    name: def.name,
    title: def.title || def.name,
    schemaType: def.type || 'document',
    fields: def.fields || [],
    ...def.options
  }
}
