import type { Field, Type } from './schema.js'

const PRIMITIVE_STRING_TYPES = new Set([
  'string',
  'text',
  'markdown',
  'html',
  'slug',
  'url',
  'email',
  'date',
  'datetime',
  'color'
])

function escapeIdentifier(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name
  }
  return `'${name.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
}

function fieldToTypeScript(field: Field, indent: string): string {
  const optional = field.validation ? '' : '?'
  const key = `${escapeIdentifier(field.name)}${optional}: `

  if (field.type === 'number') {
    return `${indent}${key}number`
  }

  if (field.type === 'boolean') {
    return `${indent}${key}boolean`
  }

  if (PRIMITIVE_STRING_TYPES.has(field.type)) {
    return `${indent}${key}string`
  }

  if (field.type === 'reference') {
    return `${indent}${key}{ _type: 'reference'; _ref: string }`
  }

  if (field.type === 'image' || field.type === 'file') {
    return `${indent}${key}{ asset?: { url?: string; [key: string]: unknown } }`
  }

  if (field.type === 'array' && field.of?.length) {
    const itemType = field.of
      .map((item) => {
        if ('type' in item && item.type === 'reference') {
          return `{ _type: 'reference'; _ref: string }`
        }
        if ('fields' in item && item.fields) {
          return objectFieldsToTypeScript(item.fields, indent)
        }
        if ('type' in item && PRIMITIVE_STRING_TYPES.has(item.type as string)) {
          return 'string'
        }
        if ('type' in item && (item.type === 'number' || item.type === 'boolean')) {
          return item.type
        }
        return 'unknown'
      })
      .join(' | ')
    return `${indent}${key}Array<${itemType}>`
  }

  if ((field.type === 'object' || field.type === 'document') && field.fields) {
    return `${indent}${key}${objectFieldsToTypeScript(field.fields, indent)}`
  }

  return `${indent}${key}unknown`
}

function objectFieldsToTypeScript(fields: Field[], indent: string): string {
  const nextIndent = `${indent}  `
  const lines = fields.map(field => fieldToTypeScript(field, nextIndent))
  return `{\n${lines.join('\n')}\n${indent}}`
}

function documentToTypeScript(type: Type): string {
  const name = type.name
  const fields = type.fields || []

  const lines: string[] = [
    `  _id: string`,
    `  _type: '${name}'`
  ]

  for (const field of fields) {
    lines.push(fieldToTypeScript(field, '  '))
  }

  return `interface Clarity${pascalCase(name)} {\n${lines.join('\n')}\n}`
}

function pascalCase(name: string): string {
  return name
    .split(/[-_./]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function generateSchemaTypes(schema: Type | Type[]): string {
  const types = Array.isArray(schema) ? schema : [schema]
  const documents = types.filter(type => type.type === 'document')

  if (!documents.length) {
    return `// No document types found in Clarity schema\n`
  }

  const declarations = documents.map(documentToTypeScript).join('\n\n')
  const union = documents.map(type => `Clarity${pascalCase(type.name)}`).join(' | ')

  return `declare global {\n${declarations}\n\n  type ClarityDocument = ${union}\n}\n\nexport {}\n`
}
