<script setup lang="ts">
import type { FieldDef } from './SchemaFormField.vue'

interface Schema {
  id?: string
  name: string
  title: string
  type: 'document'
  fields: FieldDef[]
}

const props = defineProps<{
  schema: Schema | null
  dataset: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  save: [schema: Schema]
}>()

const toast = useToast()

const original = ref<Schema>({
  name: '',
  title: '',
  type: 'document',
  fields: []
})

const local = ref<Schema>({
  name: '',
  title: '',
  type: 'document',
  fields: []
})

const addingField = ref(false)
const newField = ref<{ name: string, title: string, type: string }>({ name: '', title: '', type: 'string' })
const previewOpen = ref(false)

watch(() => props.schema, (schema) => {
  const next = schema
    ? { ...schema, fields: [...schema.fields] }
    : { name: '', title: '', type: 'document' as const, fields: [] }
  original.value = JSON.parse(JSON.stringify(next))
  local.value = next
  addingField.value = false
  newField.value = { name: '', title: '', type: 'string' }
}, { immediate: true, deep: true })

function updateField(index: number, value: FieldDef) {
  const fields = [...local.value.fields]
  fields[index] = value
  local.value = { ...local.value, fields }
}

function removeField(index: number) {
  const fields = [...local.value.fields]
  fields.splice(index, 1)
  local.value = { ...local.value, fields }
}

function addField() {
  if (!newField.value.name.trim()) return
  const name = newField.value.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
  if (local.value.fields.some(f => f.name === name)) {
    toast.add({ title: 'Field already exists', color: 'error' })
    return
  }
  local.value = {
    ...local.value,
    fields: [...local.value.fields, {
      name,
      title: newField.value.title.trim() || name,
      type: newField.value.type,
      description: ''
    }]
  }
  addingField.value = false
  newField.value = { name: '', title: '', type: 'string' }
}

function moveField(index: number, direction: number) {
  const fields = [...local.value.fields]
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= fields.length) return
  const [item] = fields.splice(index, 1)
  if (!item) return
  fields.splice(newIndex, 0, item)
  local.value = { ...local.value, fields }
}

function cancel() {
  local.value = JSON.parse(JSON.stringify(original.value))
  addingField.value = false
  newField.value = { name: '', title: '', type: 'string' }
}

async function save() {
  try {
    await $fetch('/api/schemas', {
      method: 'POST',
      query: { dataset: props.dataset },
      body: [local.value]
    })
    toast.add({ title: 'Schema saved', color: 'success' })
    emit('save', local.value)
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div
    v-if="!schema"
    class="flex-1 flex items-center justify-center text-muted"
  >
    Select a type to edit or create a new one
  </div>

  <div
    v-else
    class="flex flex-col h-full overflow-y-auto"
  >
    <div class="p-6 space-y-6">
      <!-- Breadcrumbs -->
      <div class="text-sm text-muted">
        Schemas / Edit schema
      </div>

      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold">
              {{ local.title || local.name }}
            </h1>
            <UBadge
              :label="local.type"
              color="primary"
              variant="subtle"
            />
          </div>
          <p class="text-sm text-muted mt-1">
            Editing schema structure and fields
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-code"
            label="Preview JSON"
            size="sm"
            variant="outline"
            color="neutral"
            @click="previewOpen = true"
          />
          <UButton
            v-if="!readonly"
            icon="i-lucide-save"
            label="Save schema"
            size="sm"
            color="primary"
            @click="save"
          />
        </div>
      </div>

      <!-- Basic info -->
      <UCard variant="outline">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-info"
              class="text-primary size-5"
            />
            <h2 class="font-semibold">
              Basic information
            </h2>
          </div>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Name"
            hint="Unique schema name"
          >
            <UInput
              v-model="local.name"
              disabled
            />
          </UFormField>
          <UFormField
            label="Title"
            hint="Display name"
          >
            <UInput
              v-model="local.title"
              :disabled="readonly"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Fields -->
      <UCard variant="outline">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-layout-grid"
                class="text-primary size-5"
              />
              <div>
                <h2 class="font-semibold">
                  Schema fields
                </h2>
                <p class="text-xs text-muted">
                  Define fields and their types
                </p>
              </div>
            </div>
            <UButton
              v-if="!readonly"
              icon="i-lucide-plus"
              label="Add field"
              size="sm"
              color="primary"
              @click="addingField = true"
            />
          </div>
        </template>

        <div class="space-y-4">
          <SchemaFieldEditor
            v-for="(field, index) in local.fields"
            :key="field.name"
            :field="field"
            :index="index"
            :total="local.fields.length"
            :readonly="readonly"
            @update="v => updateField(index, v)"
            @remove="removeField(index)"
            @move="direction => moveField(index, direction)"
          />

          <div
            v-if="!readonly"
            class="rounded-lg border border-dashed border-default p-4 text-center"
          >
            <UButton
              v-if="!addingField"
              icon="i-lucide-plus"
              label="Add field"
              variant="ghost"
              color="primary"
              @click="addingField = true"
            />
            <div
              v-else
              class="space-y-3"
            >
              <div class="grid grid-cols-3 gap-3">
                <UInput
                  v-model="newField.name"
                  placeholder="name"
                />
                <UInput
                  v-model="newField.title"
                  placeholder="title"
                />
                <USelect
                  v-model="newField.type"
                  :items="['string', 'text', 'number', 'boolean', 'slug', 'url', 'email', 'date', 'datetime', 'image', 'file', 'reference', 'object', 'block', 'document']"
                />
              </div>
              <div class="flex items-center justify-center gap-2">
                <UButton
                  size="sm"
                  @click="addField"
                >
                  Add
                </UButton>
                <UButton
                  size="sm"
                  variant="ghost"
                  @click="addingField = false"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Hint + actions -->
      <UCard variant="outline">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-lightbulb"
              class="text-primary size-8"
            />
            <div>
              <h3 class="font-semibold">
                Hint
              </h3>
              <p class="text-sm text-muted">
                You can drag fields to reorder. Nested arrays support unlimited depth.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              v-if="!readonly"
              variant="outline"
              color="neutral"
              @click="cancel"
            >
              Cancel
            </UButton>
            <UButton
              v-if="!readonly"
              icon="i-lucide-save"
              label="Save schema"
              color="primary"
              @click="save"
            />
          </div>
        </div>
      </UCard>
    </div>

    <UModal
      :open="previewOpen"
      title="Schema JSON"
      @update:open="previewOpen = $event"
    >
      <template #body>
        <pre class="text-xs font-mono bg-elevated/50 p-3 rounded-lg overflow-auto max-h-96">{{ JSON.stringify(local, null, 2) }}</pre>
      </template>
    </UModal>
  </div>
</template>
