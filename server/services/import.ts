export interface InferredField {
  name: string
  title: string
  type: string
  fields?: InferredField[]
  of?: InferredField[]
  to?: Array<{ type: string }>
}

export interface InferredSchema {
  name: string
  title: string
  type: 'document'
  fields: InferredField[]
}

function inferFieldType(key: string, value: unknown): InferredField {
  const base: InferredField = { name: key, title: key, type: 'string' }

  if (value === null || value === undefined) {
    return base
  }

  if (typeof value === 'string') {
    // Try detect date strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return { ...base, type: 'datetime' }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { ...base, type: 'date' }
    }
    return { ...base, type: 'string' }
  }

  if (typeof value === 'number') {
    return { ...base, type: 'number' }
  }

  if (typeof value === 'boolean') {
    return { ...base, type: 'boolean' }
  }

  if (Array.isArray(value)) {
    const firstItem = value.find(item => item !== null && item !== undefined)
    const itemType = firstItem ? inferFieldType('item', firstItem) : { name: 'item', title: 'Item', type: 'string' }

    // Portable text blocks
    if (firstItem && typeof firstItem === 'object' && (firstItem as Record<string, unknown>)._type === 'block') {
      return { ...base, type: 'array', of: [{ name: 'block', title: 'Block', type: 'block' }] }
    }

    return { ...base, type: 'array', of: [itemType] }
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const objectType = obj._type

    if (objectType === 'reference' && typeof obj._ref === 'string') {
      return { ...base, type: 'reference', to: [] }
    }

    if (objectType === 'image') {
      return { ...base, type: 'image' }
    }

    if (objectType === 'file') {
      return { ...base, type: 'file' }
    }

    if (objectType === 'slug') {
      return { ...base, type: 'slug' }
    }

    if (objectType === 'block') {
      return { ...base, type: 'block' }
    }

    const nestedFields = Object.entries(obj)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => inferFieldType(k, v))

    return { ...base, type: 'object', fields: nestedFields }
  }

  return base
}

function normalizeField(field: unknown): InferredField {
  if (typeof field !== 'object' || field === null) {
    return { name: 'unknown', title: 'Unknown', type: 'string' }
  }
  const f = field as Record<string, unknown>
  const children = f.fields
  const items = f.of

  return {
    name: String(f.name || 'unknown'),
    title: String(f.title || f.name || 'Unknown'),
    type: String(f.type || 'string'),
    fields: Array.isArray(children) ? children.map(normalizeField) : undefined,
    of: Array.isArray(items) ? items.map(normalizeField) : undefined,
    to: Array.isArray(f.to) ? (f.to as Array<{ type: string }>) : undefined
  }
}

function parseSchemaArray(arr: unknown[]): InferredSchema[] {
  return arr
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && (item as Record<string, unknown>).type === 'document'
    )
    .map((item) => {
      const fields = Array.isArray(item.fields) ? item.fields.map(normalizeField) : []
      return {
        name: String(item.name),
        title: String(item.title || item.name),
        type: 'document' as const,
        fields
      }
    })
    .filter(s => !s.name.startsWith('_') && !s.name.startsWith('sanity.'))
}

export function extractSchemasFromDocument(doc: Record<string, unknown>): InferredSchema[] | null {
  const rawSchema = doc.schema
  if (typeof rawSchema === 'string') {
    try {
      const parsed = JSON.parse(rawSchema)
      if (Array.isArray(parsed)) {
        const schemas = parseSchemaArray(parsed)
        if (schemas.length) return schemas
      }
    } catch {
      // ignore
    }
  }

  if (Array.isArray(rawSchema)) {
    const schemas = parseSchemaArray(rawSchema)
    if (schemas.length) return schemas
  }

  const candidates = ['schemas', 'content', 'value', 'data']
  for (const key of candidates) {
    const value = doc[key]
    if (Array.isArray(value)) {
      const parsed = parseSchemaArray(value)
      if (parsed.length) return parsed
    }
  }

  // Fallback: any array field that looks like schemas
  for (const value of Object.values(doc)) {
    if (Array.isArray(value)) {
      const parsed = parseSchemaArray(value)
      if (parsed.length) return parsed
    }
  }

  return null
}

export function inferSchemas(docs: Record<string, unknown>[]): InferredSchema[] {
  const schemasByType = new Map<string, Map<string, InferredField>>()

  for (const doc of docs) {
    const type = doc._type as string
    if (!type) continue

    if (!schemasByType.has(type)) {
      schemasByType.set(type, new Map())
    }

    const fields = schemasByType.get(type)!

    for (const [key, value] of Object.entries(doc)) {
      if (key.startsWith('_')) continue
      if (!fields.has(key)) {
        fields.set(key, inferFieldType(key, value))
      }
    }
  }

  return Array.from(schemasByType.entries()).map(([type, fieldsMap]) => ({
    name: type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    type: 'document' as const,
    fields: Array.from(fieldsMap.values())
  }))
}

export function mapDocument(doc: Record<string, unknown>): {
  id: string
  type: string
  rev: string
  createdAt: string
  updatedAt: string
  data: Record<string, unknown>
} {
  const {
    _id,
    _type,
    _rev,
    _createdAt,
    _updatedAt,
    ...data
  } = doc

  return {
    id: String(_id),
    type: String(_type),
    rev: String(_rev || crypto.randomUUID()),
    createdAt: String(_createdAt || new Date().toISOString()),
    updatedAt: String(_updatedAt || new Date().toISOString()),
    data
  }
}

export function getAssetId(ref: string): string {
  return ref.replace(/^image-/, '').replace(/^file-/, '')
}

export function isAssetDoc(doc: Record<string, unknown>): boolean {
  const t = doc._type
  return t === 'sanity.imageAsset' || t === 'sanity.fileAsset'
}

export function buildAssetMap(assetDocs: Record<string, unknown>[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const doc of assetDocs) {
    const id = doc._id as string
    const url = doc.url as string | undefined
    if (id && url) {
      map.set(id, url)
      map.set(getAssetId(id), url)
    }
  }
  return map
}

export function transformAssetRefs(
  value: unknown,
  _assetUrlMap: Map<string, string>
): unknown {
  // Asset references are now preserved for GROQ dereferencing.
  // This helper only recurses to keep the structure intact.
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => transformAssetRefs(item, _assetUrlMap))
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const next: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) {
      next[key] = transformAssetRefs(val, _assetUrlMap)
    }
    return next
  }

  return value
}

export interface AssetUploadTask {
  sanityId: string
  url: string
  extension?: string
  mimeType?: string
  originalFilename?: string
}

export async function fetchAssetBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
