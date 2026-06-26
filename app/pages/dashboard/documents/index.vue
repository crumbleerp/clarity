<script setup lang="ts">
import type { FieldDef } from '~/components/SchemaFormField.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { data: schemas } = await useFetch('/api/schemas')
const { data: allDocs, refresh: refreshDocs } = await useFetch('/api/documents', {
  query: { limit: 1000 }
})

const selectedType = computed<string>({
  get: () => (route.query.type as string) || (schemas.value?.[0]?.name as string) || '',
  set: (type) => {
    router.push({ query: { ...route.query, type, id: undefined } })
  }
})

const itemsForType = computed(() => {
  const docs = allDocs.value?.documents || []
  return docs.filter(d => d._type === selectedType.value)
})

const selectedId = computed<string | undefined>({
  get: () => route.query.id as string | undefined,
  set: (id) => {
    router.push({ query: { ...route.query, id } })
  }
})

const selectedDoc = computed(() => {
  return itemsForType.value.find(d => d._id === selectedId.value)
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

watch(selectedDoc, (doc) => {
  if (doc) {
    const { _id, _rev, _originalId, _createdAt, _updatedAt, _type, ...rest } = doc
    itemData.value = { ...(rest as Record<string, unknown>) }
    jsonInput.value = JSON.stringify(rest, null, 2)
  } else {
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

async function createDocument(typeName: string) {
  try {
    const result = await $fetch('/api/documents', {
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

async function saveDocument() {
  try {
    const id = selectedId.value
    const payload = showJson.value ? JSON.parse(jsonInput.value) : itemData.value
    if (!id) return
    await $fetch(`/api/documents/${id}`, { method: 'PUT', body: payload })
    toast.add({ title: 'Document saved', color: 'success' })
    isDirty.value = false
    await refreshDocs()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteDocument(id: string) {
  await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
  toast.add({ title: 'Document deleted', color: 'success' })
  if (selectedId.value === id) selectedId.value = undefined
  await refreshDocs()
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex">
    <!-- Types pane -->
    <div class="w-60 border-r border-default flex flex-col bg-elevated/25">
      <div class="p-3 border-b border-default font-medium text-sm text-muted h-12">
        Types
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <UButton
          v-for="schema in schemas"
          :variant="selectedType === schema.name ? 'subtle' : 'ghost'"
          :color="selectedType === schema.name ? 'secondary' : 'neutral'"
          :key="schema.id"
          class="w-full"
          @click="selectedType = schema.name"
        >
          {{ schema.title }}
        </UButton>
      </div>
    </div>

    <!-- Items pane -->
    <div class="w-80 border-r border-default flex flex-col bg-elevated/50">
      <div class="p-3 border-b border-default flex items-center justify-between h-12">
        <span class="font-medium text-sm text-muted">Items</span>
        <UButton
          v-if="selectedType"
          icon="i-lucide-plus"
          color="neutral"
          size="xs"
          variant="ghost"
          @click="createDocument(selectedType)"
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <div
          v-if="itemsForType.length === 0"
          class="p-8 text-center text-muted text-sm"
        >
          No items
        </div>
        <div
          v-for="doc in itemsForType"
          :key="doc._id as string"
          class="group flex items-center justify-between px-4 py-3 border-b border-default cursor-pointer hover:bg-elevated"
          :class="selectedId === doc._id ? 'bg-elevated' : ''"
          @click="selectedId = doc._id as string"
        >
          <span class="text-sm truncate">{{ previewTitle(doc) }}</span>
          <UButton
            icon="i-lucide-trash"
            size="xs"
            color="error"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100"
            @click.stop="deleteDocument(doc._id as string)"
          />
        </div>
      </div>
    </div>

    <!-- Editor pane -->
    <div class="flex-1 flex flex-col min-w-0 bg-background">
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
              icon="i-lucide-save"
              label="Save"
              size="sm"
              :disabled="!isDirty && !showJson"
              @click="saveDocument"
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
            v-model="itemData"
            :fields="schemaFields"
            @update:model-value="isDirty = true"
          />
        </div>
      </template>
    </div>
  </div>
</template>
