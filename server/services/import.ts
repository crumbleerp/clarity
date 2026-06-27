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

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isReference(value: unknown): boolean {
  return isObject(value) && value._type === 'reference' && typeof value._ref === 'string'
}

function isImageObject(value: unknown): boolean {
  return isObject(value) && (value._type === 'image' || value._type === 'sanity.imageAsset')
}

function isFileObject(value: unknown): boolean {
  return isObject(value) && (value._type === 'file' || value._type === 'sanity.fileAsset')
}

function isBlockObject(value: unknown): boolean {
  return isObject(value) && value._type === 'block'
}

function inferDateType(value: string): 'date' | 'datetime' | null {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'datetime'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  return null
}

function classifyPrimitive(values: unknown[]): 'string' | 'number' | 'boolean' | 'date' | 'datetime' {
  const types = new Set<string>()
  for (const v of values) {
    if (typeof v === 'number') types.add('number')
    else if (typeof v === 'boolean') types.add('boolean')
    else if (typeof v === 'string') {
      const dt = inferDateType(v)
      if (dt === 'datetime') types.add('datetime')
      else if (dt === 'date') types.add('date')
      else types.add('string')
    } else {
      types.add('string')
    }
  }

  if (types.size > 1) return 'string'
  if (types.has('number')) return 'number'
  if (types.has('boolean')) return 'boolean'
  if (types.has('datetime')) return 'datetime'
  if (types.has('date')) return 'date'
  return 'string'
}

function collectNestedFields(values: Record<string, unknown>[], idToType: Map<string, string>): InferredField[] {
  const fieldValues = new Map<string, unknown[]>()

  for (const obj of values) {
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith('_')) continue
      if (!fieldValues.has(key)) fieldValues.set(key, [])
      fieldValues.get(key)!.push(val)
    }
  }

  return Array.from(fieldValues.entries()).map(([key, vals]) => classifyField(key, vals, idToType))
}

function classifyReference(name: string, values: Record<string, unknown>[], idToType: Map<string, string>): InferredField {
  const targets = new Set<string>()
  for (const obj of values) {
    const ref = obj._ref
    if (typeof ref === 'string') {
      const target = idToType.get(ref)
      if (target) targets.add(target)
    }
  }
  return {
    name,
    title: name,
    type: 'reference',
    to: Array.from(targets).map(type => ({ type }))
  }
}

function detectSpecialType(values: Record<string, unknown>[]): string | null {
  const counts = new Map<string, number>()
  for (const obj of values) {
    const t = obj._type
    if (typeof t === 'string') counts.set(t, (counts.get(t) || 0) + 1)
  }

  if (counts.size === 0) return null

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return null

  const [type, count] = sorted[0]!
  if (count === values.length) return type
  return null
}

function classifyObject(name: string, values: Record<string, unknown>[], idToType: Map<string, string>): InferredField {
  const specialType = detectSpecialType(values)

  if (specialType === 'reference' || (specialType === null && values.every(isReference))) {
    return classifyReference(name, values, idToType)
  }

  if (specialType === 'slug') {
    return { name, title: name, type: 'slug' }
  }

  if (specialType === 'block') {
    return { name, title: name, type: 'block' }
  }

  if (specialType === 'image' || specialType === 'sanity.imageAsset' || values.every(isImageObject)) {
    return { name, title: name, type: 'image' }
  }

  if (specialType === 'file' || specialType === 'sanity.fileAsset' || values.every(isFileObject)) {
    return { name, title: name, type: 'file' }
  }

  const fields = collectNestedFields(values, idToType)
  return { name, title: name, type: 'object', fields }
}

function isPortableText(items: unknown[]): boolean {
  return items.some(v => isBlockObject(v))
}

function classifyField(name: string, values: unknown[], idToType: Map<string, string>): InferredField {
  const nonNull = values.filter(v => v !== null && v !== undefined)

  if (nonNull.length === 0) {
    return { name, title: name, type: 'string' }
  }

  const hasArray = nonNull.some(Array.isArray)
  if (hasArray) {
    const items: unknown[] = []
    for (const v of nonNull) {
      if (Array.isArray(v)) items.push(...v.filter(x => x !== null && x !== undefined))
    }

    if (isPortableText(items)) {
      return { name, title: name, type: 'array', of: [{ name: 'block', title: 'Block', type: 'block' }] }
    }

    const itemField = classifyField('item', items, idToType)
    return { name, title: name, type: 'array', of: [itemField] }
  }

  const objectValues = nonNull.filter(isObject)
  if (objectValues.length > 0) {
    return classifyObject(name, objectValues, idToType)
  }

  const type = classifyPrimitive(nonNull)
  return { name, title: name, type }
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

  for (const value of Object.values(doc)) {
    if (Array.isArray(value)) {
      const parsed = parseSchemaArray(value)
      if (parsed.length) return parsed
    }
  }

  return null
}

export function inferSchemas(docs: Record<string, unknown>[]): InferredSchema[] {
  const idToType = new Map<string, string>()

  for (const doc of docs) {
    const id = doc._id
    const type = doc._type
    if (typeof id === 'string' && typeof type === 'string') {
      idToType.set(id, type)
    }
  }

  const fieldValuesByType = new Map<string, Map<string, unknown[]>>()

  for (const doc of docs) {
    const type = doc._type as string
    if (!type) continue

    if (!fieldValuesByType.has(type)) {
      fieldValuesByType.set(type, new Map())
    }

    const typeFields = fieldValuesByType.get(type)!

    for (const [key, value] of Object.entries(doc)) {
      if (key.startsWith('_')) continue
      if (!typeFields.has(key)) typeFields.set(key, [])
      typeFields.get(key)!.push(value)
    }
  }

  return Array.from(fieldValuesByType.entries()).map(([type, fieldMap]) => {
    const fields = Array.from(fieldMap.entries()).map(([key, values]) => classifyField(key, values, idToType))
    return {
      name: type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      type: 'document' as const,
      fields
    }
  })
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
