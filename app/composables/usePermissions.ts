export type UserRole = 'root' | 'admin' | 'moderator' | 'guest'

export function usePermissions() {
  const { user } = useAuth()

  const role = computed<UserRole>(() => (user.value?.role ?? 'guest') as UserRole)

  const isGuest = computed(() => role.value === 'guest')
  const isModerator = computed(() => role.value === 'moderator')
  const isAdmin = computed(() => role.value === 'admin')
  const isRoot = computed(() => role.value === 'root')
  const isAdminOrRoot = computed(() => isAdmin.value || isRoot.value)
  const isModeratorOrAbove = computed(() => isModerator.value || isAdmin.value || isRoot.value)

  const canReadDocuments = computed(() => true)
  const canWriteDocuments = computed(() => isModeratorOrAbove.value)
  const canWriteSchemas = computed(() => isModeratorOrAbove.value)
  const canWriteMedia = computed(() => isModeratorOrAbove.value)
  const canImport = computed(() => isModeratorOrAbove.value)
  const canCreateDatasets = computed(() => isAdminOrRoot.value)
  const canManageUsers = computed(() => isAdminOrRoot.value)
  const canManageTokens = computed(() => isAdminOrRoot.value)
  const canManageOrigins = computed(() => isAdminOrRoot.value)
  const canTruncate = computed(() => isRoot.value)
  const canSeeSettings = computed(() => !isGuest.value)

  function canAssignRole(targetRole: UserRole): boolean {
    if (isRoot.value) return true
    if (isAdmin.value) return targetRole === 'guest' || targetRole === 'moderator'
    return false
  }

  const assignableRoles = computed(() => {
    const all: { label: string, value: UserRole }[] = [
      { label: 'Admin', value: 'admin' },
      { label: 'Moderator', value: 'moderator' },
      { label: 'Guest', value: 'guest' }
    ]
    if (isRoot.value) return [{ label: 'Root', value: 'root' }, ...all]
    if (isAdmin.value) return all.filter(r => r.value === 'guest' || r.value === 'moderator')
    return []
  })

  return {
    role,
    isGuest,
    isModerator,
    isAdmin,
    isRoot,
    isAdminOrRoot,
    isModeratorOrAbove,
    canReadDocuments,
    canWriteDocuments,
    canWriteSchemas,
    canWriteMedia,
    canImport,
    canCreateDatasets,
    canManageUsers,
    canManageTokens,
    canManageOrigins,
    canTruncate,
    canSeeSettings,
    canAssignRole,
    assignableRoles
  }
}
