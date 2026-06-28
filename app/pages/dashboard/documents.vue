<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { FieldDef } from '~/components/SchemaFormField.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const currentDataset = useCurrentDataset()
const { canWriteDocuments } = usePermissions()

const { data: schemas, refresh: refreshSchemas } = await useFetch('/api/schemas', {
  query: computed(() => ({ dataset: currentDataset.value }))
})

const documents = ref<Record<string, unknown>[]>([])
const total = ref(0)
const loading = ref(false)
const limit = 50

const hasMore = computed(() => documents.value.length < total.value)

async function fetchDocuments(append = false) {
  if (loading.value) return
  if (append && !hasMore.value) return
  if (!selectedType.value) return

  loading.value = true
  const offset = append ? documents.value.length : 0

  try {
    const params = new URLSearchParams({
      dataset: currentDataset.value,
      type: selectedType.value,
      limit: String(limit),
      offset: String(offset),
      orderBy: 'updatedAt',
      orderDir: 'desc'
    })
    const res = await $fetch<{ documents: Record<string, unknown>[], total: number, limit: number, offset: number }>(`/api/documents?${params}`)

    if (append) {
      documents.value.push(...res.documents)
    } else {
      documents.value = res.documents
    }

    total.value = res.total
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  } finally {
    loading.value = false
    await nextTick()
    checkFill()
  }
}

async function refreshDocs() {
  await fetchDocuments(false)
}

const selectedType = computed<string>({
  get: () => (route.query.type as string) || (schemas.value?.[0]?.name as string) || '',
  set: (type) => {
    router.push({ query: { ...route.query, type, id: undefined } })
  }
})

watch([currentDataset, selectedType], () => {
  refreshSchemas()
  fetchDocuments(false)
}, { immediate: true })

const selectedId = computed<string | undefined>({
  get: () => route.query.id as string | undefined,
  set: (id) => {
    router.push({ query: { ...route.query, id } })
  }
})

const selectedDoc = computed(() => {
  return documents.value.find(d => d._id === selectedId.value)
})

const selectedSchema = computed(() => {
  return schemas.value?.find(s => s.name === selectedType.value)
})

const schemaFields = computed<FieldDef[]>(() => {
  return (selectedSchema.value?.fields as FieldDef[] | undefined) || []
})

const itemData = ref<Record<string, unknown>>({})
const isDirty = ref(false)
const showJson = ref(false)
const jsonInput = ref('')
const status = ref<'draft' | 'published' | 'archived'>('published')
const publishedAt = ref<string | null>(null)

watch(selectedDoc, (doc) => {
  if (doc) {
    status.value = (doc._status as 'draft' | 'published' | 'archived') || 'published'
    publishedAt.value = (doc._publishedAt as string | null) ?? null
    const { _id, _rev, _originalId, _createdAt, _updatedAt, _type, _status, _publishedAt, ...rest } = doc
    itemData.value = { ...(rest as Record<string, unknown>) }
    jsonInput.value = JSON.stringify(rest, null, 2)
  } else {
    status.value = 'published'
    publishedAt.value = null
    itemData.value = {}
    jsonInput.value = '{}'
  }
  isDirty.value = false
}, { immediate: true })

function previewTitle(doc: Record<string, unknown>) {
  const candidates = ['title', 'name', 'label', 'id', 'headline', 'value']
  for (const key of candidates) {
    const val = doc[key]
    if (typeof val === 'string') return val
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = val as Record<string, unknown>
      for (const k of ['ru', 'en']) {
        if (typeof nested[k] === 'string') return nested[k]
      }
    }
  }
  return (doc._id as string).slice(0, 8)
}

function statusColor(docStatus: string) {
  if (docStatus === 'published') return 'success'
  if (docStatus === 'draft') return 'warning'
  return 'neutral'
}

function onItemDataChange(value: Record<string, unknown>) {
  itemData.value = value
  isDirty.value = true
}

async function createType() {
  const name = newType.value.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
  const title = newType.value.title.trim() || name
  if (!name) {
    useToast().add({ title: 'Type name is required', color: 'error' })
    return
  }
  try {
    await $fetch('/api/schemas', {
      method: 'POST',
      query: { dataset: currentDataset.value },
      body: [{
        name,
        title,
        type: 'document',
        fields: []
      }]
    })
    useToast().add({ title: 'Type created', color: 'success' })
    showCreateTypeModal.value = false
    newType.value = { name: '', title: '' }
    await refreshSchemas()
    selectedSchemaForEdit.value = schemas.value?.find(s => s.name === name) || null
  } catch (e: unknown) {
    useToast().add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

function documentActionItems(doc: Record<string, unknown>) {
  return [
    [{
      label: 'History',
      icon: 'i-lucide-history',
      onSelect: () => {
        selectedId.value = doc._id as string
        openHistory()
      }
    }],
    [{
      label: 'Archive',
      icon: 'i-lucide-archive',
      onSelect: () => archiveDocument(doc._id as string)
    }],
    [{
      label: 'Delete',
      icon: 'i-lucide-trash',
      onSelect: () => deleteDocument(doc._id as string)
    }]
  ]
}

async function createDocument(typeName: string) {
  try {
    const result = await $fetch(`/api/documents?dataset=${encodeURIComponent(currentDataset.value)}`, {
      method: 'POST',
      body: { _type: typeName }
    })
    toast.add({ title: 'Document created', color: 'success' })
    await refreshDocs()
    selectedId.value = (result as { _id: string })._id
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function putDocument(id: string, body: Record<string, unknown>) {
  return $fetch<Record<string, unknown>>(`/api/documents/${id}?dataset=${encodeURIComponent(currentDataset.value)}`, {
    method: 'PUT',
    body
  })
}

async function autosaveDocument() {
  const id = selectedId.value
  if (!id || !canWriteDocuments.value) return
  try {
    const base = showJson.value ? JSON.parse(jsonInput.value) : itemData.value
    await putDocument(id, {
      ...base,
      _status: 'draft'
    })
    status.value = 'draft'
    const doc = documents.value.find(d => d._id === id)
    if (doc) doc._status = 'draft'
    isDirty.value = false
  } catch (e: unknown) {
    // auto-save failures are silent to avoid interrupting the user
    console.error('Autosave failed', e)
  }
}

async function publishDocument() {
  const id = selectedId.value
  if (!id || !canWriteDocuments.value) return
  try {
    const base = showJson.value ? JSON.parse(jsonInput.value) : itemData.value
    await putDocument(id, {
      ...base,
      _status: 'published'
    })
    status.value = 'published'
    isDirty.value = false
    await refreshDocs()
    toast.add({ title: 'Published', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function archiveDocument(id: string) {
  try {
    await putDocument(id, { _status: 'archived' })
    toast.add({ title: 'Document archived', color: 'success' })
    if (selectedId.value === id) selectedId.value = undefined
    await refreshDocs()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteDocument(id: string) {
  await $fetch(`/api/documents/${id}?dataset=${encodeURIComponent(currentDataset.value)}`, {
    method: 'DELETE'
  })
  toast.add({ title: 'Document deleted', color: 'success' })
  if (selectedId.value === id) selectedId.value = undefined
  await refreshDocs()
}

const scrollElementRef = ref<HTMLElement | null>(null)

const virtualizer = useVirtualizer(computed(() => ({
  count: documents.value.length,
  getScrollElement: () => scrollElementRef.value,
  estimateSize: () => 53,
  overscan: 5
})))

function onScroll(event: Event) {
  const el = event.target as HTMLElement
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200
  if (nearBottom && hasMore.value && !loading.value) {
    fetchDocuments(true)
  }
}

function checkFill() {
  const el = scrollElementRef.value
  if (el && el.scrollHeight <= el.clientHeight && hasMore.value && !loading.value) {
    fetchDocuments(true)
  }
}

const historyOpen = ref(false)
const revisions = ref<Record<string, unknown>[]>([])
const previewRevisionOpen = ref(false)
const selectedRevision = ref<Record<string, unknown> | null>(null)

async function openHistory() {
  historyOpen.value = true
  await loadRevisions()
}

function openPreviewRevision(rev: Record<string, unknown>) {
  selectedRevision.value = rev
  previewRevisionOpen.value = true
}

async function loadRevisions() {
  if (!selectedId.value) return
  try {
    const res = await $fetch<{ revisions: Record<string, unknown>[] }>(`/api/documents/${selectedId.value}/revisions?dataset=${encodeURIComponent(currentDataset.value)}`)
    revisions.value = res.revisions
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function restoreRevision(rev: Record<string, unknown>) {
  const id = selectedId.value
  if (!id) return
  const {
    _id, _originalId, _rev, _createdAt, _updatedAt, _type,
    _isRevision, _revisionOf, _deletedAt, _status, _publishedAt,
    ...data
  } = rev
  try {
    await putDocument(id, {
      _status,
      _publishedAt,
      ...data
    })
    toast.add({ title: 'Revision restored', color: 'success' })
    historyOpen.value = false
    await refreshDocs()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

let autosaveTimeout: ReturnType<typeof setTimeout> | null = null

watch(isDirty, (dirty) => {
  if (dirty) {
    if (autosaveTimeout) clearTimeout(autosaveTimeout)
    autosaveTimeout = setTimeout(() => {
      autosaveDocument()
    }, 1000)
  }
})

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (selectedId.value && canWriteDocuments.value && (isDirty.value || showJson.value)) {
      publishDocument()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

onBeforeUnmount(watchEffect(() => {
  useHead({ title: `Documents${selectedType.value ? ` | ${selectedType.value}` : ''}` })
}))
useHead({ title: `Documents${selectedType.value ? ` | ${selectedType.value}` : ''}` })

const leftSideOpen = ref(false)
const viewMode = ref<'documents' | 'schemas'>('documents')
const selectedSchemaForEdit = ref<Record<string, unknown> | null>(null)
const selectedSchemaForEditTyped = computed<{ name: string, title: string, type: 'document', fields: FieldDef[] } | null>(() => {
  const s = selectedSchemaForEdit.value
  if (!s) return null
  return {
    name: String(s.name || ''),
    title: String(s.title || ''),
    type: 'document',
    fields: Array.isArray(s.fields) ? s.fields as FieldDef[] : []
  }
})

const isTypesPaneCollapsed = computed(() => !!selectedId.value && !leftSideOpen.value)

const viewTabValue = computed<string>({
  get: () => viewMode.value,
  set: (v) => {
    if (v === 'documents' || v === 'schemas') {
      viewMode.value = v
    }
  }
})

const viewTabItems: NavigationMenuItem[] = [
  { label: 'Documents', value: 'documents' },
  { label: 'Schemas', value: 'schemas' }
]

const typeNavItems = computed<NavigationMenuItem[]>(() => {
  return (schemas.value || []).map((schema) => {
    const name = String(schema.name)
    const isActive = viewMode.value === 'documents'
      ? selectedType.value === name
      : selectedSchemaForEdit.value?.name === name

    return {
      label: String(schema.title || name),
      icon: String(schema.title || '').includes('tag') ? 'i-lucide-tag' : 'i-lucide-folder',
      value: name,
      active: isActive,
      onSelect: () => {
        if (viewMode.value === 'documents') {
          selectedType.value = name
        } else {
          selectedSchemaForEdit.value = schema
        }
      }
    }
  }) as NavigationMenuItem[]
})

const showCreateTypeModal = ref(false)
const newType = ref({ name: '', title: '' })
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex">
    <!-- Types pane -->
    <div
      class="w-60 border-r border-default flex flex-col bg-elevated/25"
      :class="{ 'w-12.5!': isTypesPaneCollapsed }"
    >
      <div class="p-3 border-b border-default h-12 flex items-center justify-between gap-2">
        <UTabs
          v-if="!isTypesPaneCollapsed"
          v-model="viewTabValue"
          :items="viewTabItems"
          size="xs"
          variant="pill"
          color="secondary"
          class="w-full mt-2"
        />
        <UButton
          v-if="selectedId"
          class="-m-1"
          variant="link"
          color="neutral"
          :icon="leftSideOpen ? 'i-lucide-panel-right-open' : 'i-lucide-panel-left-open'"
          @click="leftSideOpen = !leftSideOpen"
        />
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <UNavigationMenu
          :items="typeNavItems"
          orientation="vertical"
          type="single"
          variant="pill"
          color="secondary"
          highlight
          :collapsed="isTypesPaneCollapsed"
          :tooltip="true"
          class="w-full"
        />
        <UButton
          v-if="viewMode === 'schemas' && canWriteDocuments && !isTypesPaneCollapsed"
          icon="i-lucide-plus"
          size="xs"
          variant="ghost"
          class="w-full"
          @click="showCreateTypeModal = true"
        >
          Add type
        </UButton>
      </div>
    </div>

    <!-- Items pane -->
    <div
      v-if="viewMode === 'documents'"
      class="w-80 border-r border-default flex flex-col bg-elevated/50"
    >
      <div class="p-3 border-b border-default flex items-center justify-between h-12">
        <span class="font-medium text-sm text-muted">
          {{ selectedType }} ({{ documents.length }}/{{ total }})
        </span>
        <UButton
          v-if="selectedType && canWriteDocuments"
          icon="i-lucide-plus"
          color="neutral"
          size="xs"
          variant="ghost"
          @click="createDocument(selectedType)"
        />
      </div>
      <div
        ref="scrollElementRef"
        class="flex-1 overflow-y-auto relative"
        @scroll="onScroll"
      >
        <div
          v-if="documents.length === 0 && !loading"
          class="p-8 text-center text-muted text-sm"
        >
          No items
        </div>

        <div
          v-else
          :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }"
        >
          <div
            v-for="virtualRow in virtualizer.getVirtualItems()"
            :key="virtualRow.key"
            :ref="virtualizer.measureElement"
            :data-index="virtualRow.index"
            class="absolute top-0 left-0 w-full border-b border-default"
            :style="{ transform: `translateY(${virtualRow.start}px)` }"
          >
            <div
              class="group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-elevated"
              :class="selectedId === documents[virtualRow.index]!._id ? 'bg-elevated' : ''"
              @click="selectedId = documents[virtualRow.index]!._id as string; leftSideOpen = false"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm truncate">{{ previewTitle(documents[virtualRow.index]!) }}</span>
                <UBadge
                  :color="statusColor(documents[virtualRow.index]!._status as string)"
                  variant="subtle"
                  size="xs"
                  class="shrink-0 whitespace-nowrap"
                >
                  {{ documents[virtualRow.index]!._status }}
                </UBadge>
              </div>
              <UDropdownMenu
                v-if="canWriteDocuments"
                :items="documentActionItems(documents[virtualRow.index]!)"
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  class="opacity-0 group-hover:opacity-100"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>

        <div
          v-if="loading && documents.length > 0"
          class="p-2 text-center text-xs text-muted"
        >
          Loading more...
        </div>
        <div
          v-if="!hasMore && documents.length > 0"
          class="p-2 text-center text-xs text-muted"
        >
          No more documents
        </div>
      </div>
    </div>

    <!-- Editor pane -->
    <div class="flex-1 flex flex-col min-w-0 bg-background">
      <template v-if="viewMode === 'schemas'">
        <SchemaEditor
          :schema="selectedSchemaForEditTyped"
          :dataset="currentDataset"
          :readonly="!canWriteDocuments"
          @save="refreshSchemas()"
        />
      </template>

      <template v-else>
        <div
          v-if="!selectedId"
          class="flex-1 flex items-center justify-center text-muted"
        >
          Select an item to edit
        </div>

        <template v-else>
          <div class="p-4 border-b border-default flex items-center justify-between">
            <div>
              <h1 class="text-lg font-semibold">
                {{ selectedDoc?._type }}
              </h1>
              <p class="text-xs text-muted font-mono">
                {{ selectedDoc?._id }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                :label="showJson ? 'Fields' : 'JSON'"
                size="sm"
                variant="ghost"
                @click="showJson = !showJson"
              />
              <UButton
                icon="i-lucide-send"
                label="Publish"
                size="sm"
                :disabled="!canWriteDocuments"
                @click="publishDocument"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <UTextarea
              v-if="showJson"
              v-model="jsonInput"
              :rows="30"
              class="font-mono text-sm"
              @input="isDirty = true"
            />

            <DocumentObjectForm
              v-else
              :model-value="itemData"
              :fields="schemaFields"
              :dataset="currentDataset"
              :readonly="!canWriteDocuments"
              @update:model-value="onItemDataChange"
            />
          </div>
        </template>
      </template>
    </div>

    <UModal
      :open="historyOpen"
      title="Revision history"
      @update:open="historyOpen = $event"
    >
      <template #body>
        <div
          v-if="revisions.length === 0"
          class="text-sm text-muted"
        >
          No revisions
        </div>
        <div
          v-for="rev in revisions"
          :key="rev._id as string"
          class="flex items-center justify-between py-3 border-b border-default gap-3"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium truncate">{{ previewTitle(rev) }}</span>
              <UBadge
                :color="statusColor(rev._status as string)"
                variant="subtle"
                size="xs"
                class="shrink-0 whitespace-nowrap"
              >
                {{ rev._status }}
              </UBadge>
            </div>
            <div class="text-xs text-muted mt-0.5">
              {{ new Date(rev._createdAt as string).toLocaleString() }}
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-eye"
              size="xs"
              variant="ghost"
              color="neutral"
              @click="openPreviewRevision(rev)"
            />
            <UButton
              v-if="canWriteDocuments"
              icon="i-lucide-rotate-ccw"
              label="Restore"
              size="xs"
              variant="ghost"
              @click="restoreRevision(rev)"
            />
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      :open="previewRevisionOpen"
      title="Revision preview"
      @update:open="previewRevisionOpen = $event"
    >
      <template #body>
        <div
          v-if="!selectedRevision"
          class="text-sm text-muted"
        >
          No revision selected
        </div>
        <div v-else>
          <div class="flex items-center gap-2 mb-3">
            <UBadge
              :color="statusColor(selectedRevision._status as string)"
              variant="subtle"
              size="xs"
            >
              {{ selectedRevision._status }}
            </UBadge>
            <span class="text-xs text-muted">{{ new Date(selectedRevision._createdAt as string).toLocaleString() }}</span>
          </div>
          <pre class="text-xs font-mono bg-elevated/50 p-3 rounded-lg overflow-auto max-h-96">{{ JSON.stringify(selectedRevision, null, 2) }}</pre>
        </div>
      </template>
    </UModal>

    <UModal
      :open="showCreateTypeModal"
      title="Create document type"
      @update:open="showCreateTypeModal = $event"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Name"
            name="type-name"
          >
            <UInput
              v-model="newType.name"
              placeholder="e.g. project"
            />
          </UFormField>
          <UFormField
            label="Title"
            name="type-title"
          >
            <UInput
              v-model="newType.title"
              placeholder="e.g. Project"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showCreateTypeModal = false"
            >
              Cancel
            </UButton>
            <UButton @click="createType">
              Create
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
