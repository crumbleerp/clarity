<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { trackJob, runningJobs } = useJobs()
const { isGuest, canImport, canWriteDocuments, canManageUsers, canManageTokens, canManageOrigins, canTruncate, canCreateDatasets } = usePermissions()

watchEffect(() => {
  if (isGuest.value) {
    navigateTo('/dashboard/documents')
  }
})

const importState = reactive({
  projectId: '',
  dataset: 'production',
  token: '',
  apiVersion: 'v2026-06-26',
  targetDataset: 'production'
})

const importing = ref(false)
const userModalOpen = ref(false)
const editingUser = ref<{ id: string, username: string, password: string, role: 'admin' | 'moderator' | 'guest' } | null>(null)

const tokenModalOpen = ref(false)
const createdToken = ref<string | null>(null)

const originModalOpen = ref(false)

const { data: users, refresh: refreshUsers } = await useFetch('/api/users')
const { data: accessTokens, refresh: refreshAccessTokens } = await useFetch('/api/access-tokens')
const { data: allowedOrigins, refresh: refreshAllowedOrigins } = await useFetch('/api/allowed-origins')

const visibleSections = computed(() => [
  { id: 'import', label: 'Import' },
  ...(canImport.value ? [{ id: 'export', label: 'Export' }] : []),
  ...(canManageUsers.value ? [{ id: 'users', label: 'Users' }] : []),
  ...(canManageTokens.value ? [{ id: 'access-tokens', label: 'Access Tokens' }] : []),
  ...(canManageOrigins.value ? [{ id: 'origins', label: 'Origins' }] : []),
  ...(canTruncate.value || canWriteDocuments.value ? [{ id: 'danger', label: 'Danger Zone' }] : [])
])

const activeSection = ref('import')

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

async function onImportSubmit() {
  if (runningJobs.value.length > 0) {
    toast.add({ title: 'Import already running', description: 'Wait for current import to finish', color: 'warning' })
    return
  }

  importing.value = true
  try {
    const result = await $fetch<{ jobId: string }>('/api/import/sanity', {
      method: 'POST',
      body: importState
    })

    trackJob(result.jobId)
    toast.add({ title: 'Import started', description: `Job ${result.jobId}`, color: 'info' })
  } catch (e: unknown) {
    toast.add({ title: 'Import failed', description: (e as Error).message, color: 'error' })
  } finally {
    importing.value = false
  }
}

function openCreateUser() {
  editingUser.value = null
  userModalOpen.value = true
}

function openEditUser(user: { id: string, username: string, role: string }) {
  editingUser.value = {
    id: user.id,
    username: user.username,
    password: '',
    role: user.role as 'admin' | 'moderator' | 'guest'
  }
  userModalOpen.value = true
}

async function saveUser(data: { id?: string, username: string, password: string, role: string }) {
  try {
    if (data.id) {
      await $fetch(`/api/users/${data.id}`, {
        method: 'PUT',
        body: data
      })
      toast.add({ title: 'User updated', color: 'success' })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: data
      })
      toast.add({ title: 'User created', color: 'success' })
    }
    await refreshUsers()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function saveAccessToken(data: { name: string, role: string, expiresAt: string }) {
  try {
    const result = await $fetch<{ token: string }>('/api/access-tokens', {
      method: 'POST',
      body: {
        name: data.name,
        role: data.role,
        expiresAt: data.expiresAt || undefined
      }
    })
    createdToken.value = result.token
    await refreshAccessTokens()
    toast.add({ title: 'Access token created', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteAccessToken(id: string) {
  try {
    await $fetch(`/api/access-tokens/${id}`, { method: 'DELETE' })
    await refreshAccessTokens()
    toast.add({ title: 'Access token deleted', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

function copyToken() {
  if (!createdToken.value) return
  navigator.clipboard.writeText(createdToken.value)
  toast.add({ title: 'Token copied', color: 'success' })
}

async function saveAllowedOrigin(origin: string) {
  try {
    await $fetch('/api/allowed-origins', {
      method: 'POST',
      body: { origin }
    })
    await refreshAllowedOrigins()
    toast.add({ title: 'Origin added', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteAllowedOrigin(id: string) {
  try {
    await $fetch(`/api/allowed-origins/${id}`, { method: 'DELETE' })
    await refreshAllowedOrigins()
    toast.add({ title: 'Origin deleted', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function truncateData() {
  try {
    await $fetch('/api/admin/truncate', { method: 'POST' })
    toast.add({ title: 'Data truncated', description: 'All documents and schemas removed', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  )

  for (const section of visibleSections.value) {
    const el = document.getElementById(section.id)
    if (el) observer.observe(el)
  }
})

useHead({ title: 'Settings' })
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] overflow-y-auto">
    <div class="max-w-6xl mx-auto px-6 py-10">
      <div class="grid grid-cols-12 gap-8">
        <div class="col-span-3" />
        <!-- Sidebar -->
        <aside class="fixed w-60 max-lg:hidden">
          <div class="sticky top-10">
            <h1 class="text-xl font-bold mb-6 px-3">
              Settings
            </h1>
            <nav class="flex flex-col gap-1">
              <UButton
                v-for="section in visibleSections"
                :key="section.id"
                :variant="activeSection === section.id ? 'subtle' : 'ghost'"
                :color="activeSection === section.id ? 'secondary' : 'neutral'"
                class="text-left px-3 py-2 rounded-lg text-sm transition-colors"
                @click="scrollTo(section.id)"
              >
                {{ section.label }}
              </UButton>
            </nav>
          </div>
        </aside>

        <!-- Content -->
        <main class="col-span-9 max-lg:col-span-12 space-y-16">
          <!-- Import -->
          <section
            id="import"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Import from Sanity
              </h2>

              <UBadge
                v-if="runningJobs.length > 0"
                color="info"
                variant="subtle"
              >
                Import running
              </UBadge>
              <UButton
                v-else

                type="submit"
                color="secondary"
                label="Import"
                size="sm"
                icon="i-lucide-download"
                :loading="importing"
                :disabled="importing || runningJobs.length > 0"
                @click="onImportSubmit"
              />
            </div>

            <div class="relative">
              <UCard
                variant="outline"
                :class="runningJobs.length > 0 ? 'opacity-60 pointer-events-none' : ''"
              >
                <UForm
                  :state="importState"
                  class="space-y-4"
                  @submit="onImportSubmit"
                >
                  <div class="grid grid-cols-2 gap-4">
                    <UFormField
                      label="Project ID"
                      name="projectId"
                    >
                      <UInput
                        v-model="importState.projectId"
                        placeholder="abc123de"
                      />
                    </UFormField>

                    <UFormField
                      label="Dataset"
                      name="dataset"
                    >
                      <UInput
                        v-model="importState.dataset"
                        placeholder="production"
                      />
                    </UFormField>

                    <UFormField
                      label="Read Token"
                      name="token"
                    >
                      <UInput
                        v-model="importState.token"
                        type="password"
                        placeholder="sk..."
                      />
                    </UFormField>

                    <UFormField
                      label="API Version"
                      name="apiVersion"
                    >
                      <UInput
                        v-model="importState.apiVersion"
                        placeholder="v2026-06-26"
                      />
                    </UFormField>

                    <UFormField
                      label="Target Dataset"
                      name="targetDataset"
                      class="col-span-2"
                    >
                      <DatasetSelector
                        v-model="importState.targetDataset"
                        :allow-create="canCreateDatasets"
                      />
                    </UFormField>
                  </div>
                </UForm>
              </UCard>

              <div
                v-if="runningJobs.length > 0"
                class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-default/40"
              >
                <div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-default shadow-lg">
                  <UIcon
                    name="i-lucide-loader-2"
                    class="size-4 animate-spin text-primary"
                  />
                  <span class="text-sm font-medium">Import in progress</span>
                </div>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div
                v-for="job in runningJobs"
                :key="job.id"
                class="p-3 rounded-lg border border-default bg-elevated/50"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-loader-2"
                      class="size-4 animate-spin text-primary"
                    />
                    <span class="text-sm font-medium">Import running</span>
                  </div>
                  <UBadge
                    :label="job.status"
                    variant="subtle"
                    color="primary"
                    size="xs"
                  />
                </div>
                <div class="text-xs text-muted font-mono mt-1">
                  {{ job.id }}
                </div>
                <div class="max-h-32 overflow-y-auto text-xs space-y-1 font-mono bg-default/50 p-2 rounded mt-2">
                  <div
                    v-for="(log, idx) in job.logs"
                    :key="idx"
                  >
                    {{ log }}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            v-if="canImport"
            id="export"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Export
              </h2>
            </div>

            <ExportSection />
          </section>
          <!-- Users -->
          <section
            v-if="canManageUsers"
            id="users"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Users
              </h2>
              <UButton
                v-if="canManageUsers"
                color="secondary"
                label="New User"
                icon="i-lucide-plus"
                size="sm"
                @click="openCreateUser"
              />
            </div>

            <UCard
              variant="outline"
              class="overflow-hidden"
              :ui="{ body: 'p-0!' }"
            >
              <UTable
                :data="users || []"
                :columns="[
                  { accessorKey: 'username', header: 'Username' },
                  { accessorKey: 'role', header: 'Role' },
                  { accessorKey: 'createdAt', header: 'Created' },
                  { id: 'actions', header: 'Actions' }
                ]"
              >
                <template #createdAt-cell="{ row }">
                  {{ new Date(row.original.createdAt).toLocaleDateString() }}
                </template>

                <template #actions-cell="{ row }">
                  <UButton
                    icon="i-lucide-pencil"
                    size="xs"
                    variant="ghost"
                    @click="openEditUser(row.original as { id: string, username: string, role: string })"
                  />
                </template>
              </UTable>
            </UCard>
          </section>

          <!-- Access Tokens -->
          <section
            v-if="canManageTokens"
            id="access-tokens"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Access Tokens
              </h2>
              <UButton
                v-if="canManageTokens"
                color="secondary"
                label="New Token"
                icon="i-lucide-plus"
                size="sm"
                @click="tokenModalOpen = true"
              />
            </div>

            <UCard
              variant="outline"
              class="overflow-hidden"
              :ui="{ body: 'p-0!' }"
            >
              <UTable
                :data="accessTokens || []"
                :columns="[
                  { accessorKey: 'name', header: 'Name' },
                  { accessorKey: 'tokenPrefix', header: 'Token' },
                  { accessorKey: 'role', header: 'Role' },
                  { accessorKey: 'expiresAt', header: 'Expires' },
                  { accessorKey: 'createdAt', header: 'Created' },
                  { id: 'actions', header: 'Actions' }
                ]"
              >
                <template #expiresAt-cell="{ row }">
                  {{ row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleString() : 'Never' }}
                </template>

                <template #createdAt-cell="{ row }">
                  {{ new Date(row.original.createdAt).toLocaleDateString() }}
                </template>

                <template #actions-cell="{ row }">
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    variant="ghost"
                    color="error"
                    @click="deleteAccessToken(row.original.id)"
                  />
                </template>
              </UTable>
            </UCard>
          </section>

          <!-- Origins -->
          <section
            v-if="canManageOrigins"
            id="origins"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Allowed Origins
              </h2>
              <UButton
                v-if="canManageOrigins"
                color="secondary"
                label="New Origin"
                icon="i-lucide-plus"
                size="sm"
                @click="originModalOpen = true"
              />
            </div>

            <UCard
              variant="outline"
              class="overflow-hidden"
              :ui="{ body: 'p-0!' }"
            >
              <UTable
                :data="allowedOrigins || []"
                :columns="[
                  { accessorKey: 'origin', header: 'Origin' },
                  { accessorKey: 'createdAt', header: 'Created' },
                  { id: 'actions', header: 'Actions' }
                ]"
              >
                <template #createdAt-cell="{ row }">
                  {{ new Date(row.original.createdAt).toLocaleDateString() }}
                </template>

                <template #actions-cell="{ row }">
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    variant="ghost"
                    color="error"
                    @click="deleteAllowedOrigin(row.original.id)"
                  />
                </template>
              </UTable>
            </UCard>
          </section>

          <!-- Danger Zone -->
          <section
            v-if="canTruncate || canWriteDocuments"
            id="danger"
            class="scroll-mt-10"
          >
            <h2 class="text-lg font-semibold mb-4 text-error">
              Danger Zone
            </h2>

            <TrashManager
              v-if="canWriteDocuments"
              class="mb-4"
            />

            <UCard
              v-if="canTruncate"
              variant="outline"
              class="border-error/50"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-medium">
                    Truncate all data
                  </h3>
                  <p class="text-sm text-muted mt-1">
                    Permanently delete all documents and schemas. Jobs and users will remain.
                  </p>
                </div>
                <UButton
                  label="Truncate"
                  icon="i-lucide-trash-2"
                  color="error"
                  size="sm"
                  @click="truncateData"
                />
              </div>
            </UCard>
          </section>
        </main>
      </div>

      <UserFormModal
        v-model:open="userModalOpen"
        :user="editingUser"
        @submit="saveUser"
      />

      <AccessTokenFormModal
        v-model:open="tokenModalOpen"
        @submit="saveAccessToken"
      />

      <UModal
        :open="!!createdToken"
        title="Access Token Created"
        @update:open="createdToken = null"
      >
        <template #body>
          <p class="text-sm text-muted mb-4">
            Copy this token now. You will not be able to see it again.
          </p>
          <div class="flex items-center gap-2">
            <UInput
              :model-value="createdToken || ''"
              class="flex-1"
              readonly
            />
            <UButton
              icon="i-lucide-copy"
              label="Copy"
              @click="copyToken"
            />
          </div>
        </template>
      </UModal>

      <AllowedOriginFormModal
        v-model:open="originModalOpen"
        @submit="saveAllowedOrigin"
      />
    </div>
  </div>
</template>
