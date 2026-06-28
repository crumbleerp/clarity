export function mergeDocument(row: {
  id: string
  type: string
  rev: string
  status?: string
  publishedAt?: Date | null
  deletedAt?: Date | null
  isRevision?: boolean
  revisionOf?: string | null
  createdAt: Date
  updatedAt: Date
  data: unknown
}) {
  const data = (row.data || {}) as Record<string, unknown>
  return {
    ...data,
    _id: row.id,
    _originalId: row.id,
    _rev: row.rev,
    _status: row.status ?? 'published',
    _publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    _deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    _isRevision: row.isRevision ?? false,
    _revisionOf: row.revisionOf ?? null,
    _createdAt: row.createdAt.toISOString(),
    _updatedAt: row.updatedAt.toISOString(),
    _type: row.type
  }
}
