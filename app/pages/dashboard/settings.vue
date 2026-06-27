<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { trackJob, runningJobs } = useJobs()

const importState = reactive({
  projectId: '',
  dataset: 'production',
  token: '',
  apiVersion: 'v2026-06-26',
  targetDataset: 'production'
})

const importing = ref(false)
const modalOpen = ref(false)
const editingUser = ref<{ id: string, username: string, password: string, role: 'admin' | 'moderator' | 'guest' } | null>(null)

const { data: users, refresh: refreshUsers } = await useFetch('/api/users')

const sections = [
  { id: 'import', label: 'Import' },
  { id: 'users', label: 'Users' },
  { id: 'danger', label: 'Danger Zone' }
]

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
    const result = await $fetch('/api/import/sanity', {
      method: 'POST',
      body: importState
    }) as { jobId: string }

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
  modalOpen.value = true
}

function openEditUser(user: { id: string, username: string, role: string }) {
  editingUser.value = {
    id: user.id,
    username: user.username,
    password: '',
    role: user.role as 'admin' | 'moderator' | 'guest'
  }
  modalOpen.value = true
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

  for (const section of sections) {
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
                v-for="section in sections"
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
                  <div class="grid grid-cols-2 gap-4 p-4">
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
                      <DatasetSelector v-model="importState.targetDataset" />
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
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Import manually from schema
              </h2>
            </div>

            <div class="relative">
              <SchemaImporter />
            </div>
          </section>
          <!-- Users -->
          <section
            id="users"
            class="scroll-mt-10"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">
                Users
              </h2>
              <UButton
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

          <!-- Danger Zone -->
          <section
            id="danger"
            class="scroll-mt-10"
          >
            <h2 class="text-lg font-semibold mb-4 text-error">
              Danger Zone
            </h2>

            <UCard
              variant="outline"
              class="border-error/50"
            >
              <div class="flex items-start justify-between gap-4 p-4">
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
        v-model:open="modalOpen"
        :user="editingUser"
        @submit="saveUser"
      />
    </div>
  </div>
</template>
