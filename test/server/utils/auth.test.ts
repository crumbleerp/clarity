import { describe, it, expect } from 'vitest'
import {
  isAdminOrRoot,
  isReadOnly,
  canManageUsers,
  canCreateUser,
  canUpdateUser,
  type AuthUser
} from '../../../server/utils/auth'

describe('auth helpers', () => {
  const root: AuthUser = { id: '1', username: 'root', role: 'root' }
  const admin: AuthUser = { id: '2', username: 'admin', role: 'admin' }
  const moderator: AuthUser = { id: '3', username: 'mod', role: 'moderator' }
  const guest: AuthUser = { id: '4', username: 'guest', role: 'guest' }

  it('identifies admin or root', () => {
    expect(isAdminOrRoot(root)).toBe(true)
    expect(isAdminOrRoot(admin)).toBe(true)
    expect(isAdminOrRoot(moderator)).toBe(false)
  })

  it('identifies read-only users', () => {
    expect(isReadOnly(guest)).toBe(true)
    expect(isReadOnly(moderator)).toBe(false)
  })

  it('only admins and roots can manage users', () => {
    expect(canManageUsers(root)).toBe(true)
    expect(canManageUsers(admin)).toBe(true)
    expect(canManageUsers(moderator)).toBe(false)
  })

  it('allows root to create any role', () => {
    expect(canCreateUser(root, 'root')).toBe(true)
    expect(canCreateUser(root, 'admin')).toBe(true)
  })

  it('allows admin to create guests and moderators only', () => {
    expect(canCreateUser(admin, 'guest')).toBe(true)
    expect(canCreateUser(admin, 'moderator')).toBe(true)
    expect(canCreateUser(admin, 'admin')).toBe(false)
    expect(canCreateUser(admin, 'root')).toBe(false)
  })

  it('prevents moderator from creating users', () => {
    expect(canCreateUser(moderator, 'guest')).toBe(false)
  })

  it('allows root to update anyone', () => {
    expect(canUpdateUser(root, { role: 'root', id: '1' })).toBe(true)
  })

  it('prevents admin from updating other admins or roots', () => {
    expect(canUpdateUser(admin, { role: 'root', id: '1' })).toBe(false)
    expect(canUpdateUser(admin, { role: 'admin', id: '2' })).toBe(false)
    expect(canUpdateUser(admin, { role: 'moderator', id: '3' })).toBe(true)
    expect(canUpdateUser(admin, { role: 'guest', id: '4' })).toBe(true)
  })
})
