export type FieldType
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

export interface Reference {
  type: 'reference'
  to: Array<{ type: string }>
}

export interface InlineFieldType {
  type: Exclude<FieldType, 'reference'> | 'reference'
  to?: Array<{ type: string }>
}

export interface Field {
  name: string
  title?: string
  type: FieldType
  description?: string
  options?: Record<string, unknown>
  fields?: Field[]
  of?: (Field | Reference | InlineFieldType)[]
  to?: Array<{ type: string }>
  validation?: unknown
  [key: string]: unknown
}

export interface Type {
  name: string
  title?: string
  type: 'document' | 'object'
  description?: string
  fields?: Field[]
  options?: Record<string, unknown>
  [key: string]: unknown
}

export function defineField<T extends Field>(def: T): T {
  return def
}

export function defineType<T extends Type>(def: T): T {
  return def
}
