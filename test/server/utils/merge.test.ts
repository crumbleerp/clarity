import { describe, it, expect } from 'vitest'
import { mergeDocument } from '../../../server/utils/merge'

describe('mergeDocument', () => {
  it('merges system fields with data', () => {
    const now = new Date()
    const result = mergeDocument({
      id: 'doc-1',
      type: 'post',
      rev: 'rev-1',
      status: 'published',
      createdAt: now,
      updatedAt: now,
      data: { title: 'Hello', slug: 'hello' }
    })

    expect(result._id).toBe('doc-1')
    expect(result._type).toBe('post')
    expect(result._rev).toBe('rev-1')
    expect(result.title).toBe('Hello')
    expect(result.slug).toBe('hello')
    expect(result._createdAt).toBe(now.toISOString())
    expect(result._updatedAt).toBe(now.toISOString())
  })

  it('uses default values for optional system fields', () => {
    const now = new Date()
    const result = mergeDocument({
      id: 'doc-2',
      type: 'author',
      rev: 'rev-2',
      createdAt: now,
      updatedAt: now,
      data: { name: 'Ada' }
    })

    expect(result._status).toBe('published')
    expect(result._publishedAt).toBeNull()
    expect(result._deletedAt).toBeNull()
    expect(result._isRevision).toBe(false)
    expect(result._revisionOf).toBeNull()
  })

  it('overrides data keys with system fields', () => {
    const now = new Date()
    const result = mergeDocument({
      id: 'doc-3',
      type: 'page',
      rev: 'rev-3',
      createdAt: now,
      updatedAt: now,
      data: { _id: 'should-be-overridden', title: 'Page' }
    })

    expect(result._id).toBe('doc-3')
  })
})
