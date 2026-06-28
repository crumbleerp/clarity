import { describe, it, expect } from 'vitest'
import { inferSchemas, mapDocument, isAssetDoc, getAssetId } from '../../../server/services/import'

describe('inferSchemas', () => {
  it('infers string and number fields', () => {
    const docs = [
      { _id: 'a', _type: 'post', title: 'First', views: 10 },
      { _id: 'b', _type: 'post', title: 'Second', views: 20 }
    ]

    const schemas = inferSchemas(docs)
    expect(schemas).toHaveLength(1)
    expect(schemas[0]!.name).toBe('post')

    const fields = schemas[0]!.fields
    const title = fields.find(f => f.name === 'title')
    const views = fields.find(f => f.name === 'views')

    expect(title?.type).toBe('string')
    expect(views?.type).toBe('number')
  })

  it('infers reference fields', () => {
    const docs = [
      { _id: 'author-1', _type: 'author', name: 'Ada' },
      { _id: 'post-1', _type: 'post', title: 'Hello', author: { _type: 'reference', _ref: 'author-1' } }
    ]

    const schemas = inferSchemas(docs)
    const postSchema = schemas.find(s => s.name === 'post')
    const authorField = postSchema?.fields.find(f => f.name === 'author')

    expect(authorField?.type).toBe('reference')
    expect(authorField?.to).toContainEqual({ type: 'author' })
  })
})

describe('mapDocument', () => {
  it('splits system fields from data', () => {
    const doc = {
      _id: 'doc-1',
      _type: 'post',
      _rev: 'rev-1',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-02T00:00:00.000Z',
      title: 'Hello'
    }

    const mapped = mapDocument(doc)
    expect(mapped.id).toBe('doc-1')
    expect(mapped.type).toBe('post')
    expect(mapped.data).toEqual({ title: 'Hello' })
  })
})

describe('isAssetDoc', () => {
  it('returns true for image and file assets', () => {
    expect(isAssetDoc({ _type: 'sanity.imageAsset' })).toBe(true)
    expect(isAssetDoc({ _type: 'sanity.fileAsset' })).toBe(true)
    expect(isAssetDoc({ _type: 'post' })).toBe(false)
  })
})

describe('getAssetId', () => {
  it('strips image- and file- prefixes', () => {
    expect(getAssetId('image-abc123')).toBe('abc123')
    expect(getAssetId('file-abc123')).toBe('abc123')
    expect(getAssetId('abc123')).toBe('abc123')
  })
})
