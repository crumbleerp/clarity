export function mergeDocument(row: {
  id: string
  type: string
  rev: string
  createdAt: Date
  updatedAt: Date
  data: unknown
}) {
  const data = (row.data || {}) as Record<string, unknown>
  return {
    _id: row.id,
    _originalId: row.id,
    _rev: row.rev,
    _createdAt: row.createdAt.toISOString(),
    _updatedAt: row.updatedAt.toISOString(),
    _type: row.type,
    ...data
  }
}
