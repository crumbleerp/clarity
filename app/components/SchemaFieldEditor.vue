<script setup lang="ts">
import type { FieldDef } from './SchemaFormField.vue'

const props = defineProps<{
  field: FieldDef
  index: number
  total: number
  readonly?: boolean
  level?: number
}>()

const emit = defineEmits<{
  update: [value: FieldDef]
  remove: []
  move: [direction: number]
}>()

const toast = useToast()
const addingNested = ref(false)
const newNested = ref<{ name: string, title: string, type: string }>({ name: '', title: '', type: 'string' })

const fieldTypes = ['string', 'text', 'number', 'boolean', 'slug', 'url', 'email', 'date', 'datetime', 'image', 'file', 'reference', 'object', 'block', 'document']

const isArray = computed(() => props.field.type === 'array' || Array.isArray(props.field.of))

const itemType = computed(() => {
  if (props.field.type === 'array') {
    const of = props.field.of
    return Array.isArray(of) && of.length > 0 ? of[0]!.type : 'string'
  }
  return props.field.type
})

const arrayItem = computed<FieldDef | null>(() => {
  const of = props.field.of
  return isArray.value && Array.isArray(of) && of.length > 0 ? of[0]! : null
})

const hasChildren = computed(() => {
  const t = itemType.value
  return !isArray.value && (t === 'object' || t === 'document')
})

const hasItemChildren = computed(() => {
  const t = itemType.value
  return isArray.value && (t === 'object' || t === 'document')
})

const childFields = computed<FieldDef[]>({
  get: () => props.field.fields || [],
  set: v => updateField('fields', v)
})

const itemChildFields = computed<FieldDef[]>({
  get: () => arrayItem.value?.fields || [],
  set: v => updateArrayItem({ ...arrayItem.value!, fields: v })
})

function updateField<K extends keyof FieldDef>(key: K, value: FieldDef[K]) {
  emit('update', { ...props.field, [key]: value })
}

function updateArrayItem(value: FieldDef) {
  emit('update', { ...props.field, of: [value] })
}

function updateType(type: string) {
  if (isArray.value) {
    const item = arrayItem.value || { name: 'item', title: 'Item', type: 'string', description: '' }
    updateArrayItem({ ...item, type })
  } else {
    const next: FieldDef = { ...props.field, type }
    if (type !== 'object' && type !== 'document') {
      delete next.fields
    }
    emit('update', next)
  }
}

function toggleArray(value: boolean | 'indeterminate') {
  if (typeof value !== 'boolean') return
  if (value) {
    const item: FieldDef = {
      name: 'item',
      title: 'Item',
      type: itemType.value,
      description: ''
    }
    if (itemType.value === 'object' || itemType.value === 'document') {
      item.fields = props.field.fields?.length ? props.field.fields : []
    }
    emit('update', { ...props.field, type: 'array', of: [item], fields: undefined })
  } else {
    const item = arrayItem.value
    const next: FieldDef = { ...props.field, type: itemType.value, of: undefined }
    if (item && (item.type === 'object' || item.type === 'document')) {
      next.fields = item.fields?.length ? item.fields : []
    } else {
      delete next.fields
    }
    emit('update', next)
  }
}

function addNestedField() {
  if (!newNested.value.name.trim()) return
  const name = newNested.value.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
  const target = isArray.value ? itemChildFields : childFields
  if (target.value.some(f => f.name === name)) {
    toast.add({ title: 'Field already exists', color: 'error' })
    return
  }
  target.value = [...target.value, {
    name,
    title: newNested.value.title.trim() || name,
    type: newNested.value.type,
    description: ''
  }]
  addingNested.value = false
  newNested.value = { name: '', title: '', type: 'string' }
}

function removeNestedField(index: number) {
  const target = isArray.value ? itemChildFields : childFields
  const fields = [...target.value]
  fields.splice(index, 1)
  target.value = fields
}

function updateNestedField(index: number, value: FieldDef) {
  const target = isArray.value ? itemChildFields : childFields
  const fields = [...target.value]
  fields[index] = value
  target.value = fields
}
</script>

<template>
  <div class="rounded-lg border border-default bg-elevated/25 p-4 space-y-4">
    <div class="flex items-start gap-3">
      <div class="pt-2 flex flex-col gap-1 text-muted">
        <UIcon
          name="i-lucide-grip-vertical"
          class="size-5 cursor-grab"
        />
      </div>
      <div class="flex-1 space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <UFormField label="Name">
            <UInput
              :model-value="field.name"
              disabled
            />
          </UFormField>
          <UFormField label="Title">
            <UInput
              :model-value="field.title"
              :disabled="readonly"
              @update:model-value="v => updateField('title', v)"
            />
          </UFormField>
          <UFormField label="Type">
            <USelect
              :model-value="itemType"
              :items="fieldTypes"
              :disabled="readonly"
              @update:model-value="updateType"
            />
          </UFormField>
        </div>

        <div class="flex items-start gap-4">
          <UFormField
            label="Description"
            class="flex-1"
          >
            <UInput
              :model-value="field.description"
              :disabled="readonly"
              @update:model-value="v => updateField('description', v)"
            />
          </UFormField>
          <UCheckbox
            :model-value="isArray"
            label="Array"
            :disabled="readonly"
            @update:model-value="toggleArray"
          />
        </div>

        <div
          v-if="hasChildren"
          class="space-y-3 pt-2"
        >
          <h3 class="text-xs font-semibold uppercase text-muted tracking-wide">
            Nested fields
          </h3>
          <div class="space-y-2">
            <div
              v-for="(nested, idx) in childFields"
              :key="nested.name"
              class="grid grid-cols-3 gap-3 items-end"
            >
              <UFormField :label="idx === 0 ? 'Name' : undefined">
                <UInput
                  :model-value="nested.name"
                  disabled
                />
              </UFormField>
              <UFormField :label="idx === 0 ? 'Title' : undefined">
                <UInput
                  :model-value="nested.title"
                  :disabled="readonly"
                  @update:model-value="v => updateNestedField(idx, { ...nested, title: v })"
                />
              </UFormField>
              <div class="flex items-end gap-2">
                <UFormField
                  class="flex-1"
                  :label="idx === 0 ? 'Type' : undefined"
                >
                  <USelect
                    :model-value="nested.type"
                    :items="fieldTypes"
                    :disabled="readonly"
                    @update:model-value="v => updateNestedField(idx, { ...nested, type: v })"
                  />
                </UFormField>
                <UButton
                  v-if="!readonly"
                  icon="i-lucide-trash"
                  size="sm"
                  variant="ghost"
                  color="error"
                  @click="removeNestedField(idx)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="!readonly"
            class="rounded border border-dashed border-default p-3"
          >
            <div v-if="!addingNested">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="ghost"
                @click="addingNested = true"
              >
                Add nested field
              </UButton>
            </div>
            <div
              v-else
              class="grid grid-cols-3 gap-3 items-end"
            >
              <UInput
                v-model="newNested.name"
                placeholder="name"
              />
              <UInput
                v-model="newNested.title"
                placeholder="title"
              />
              <div class="flex items-end gap-2">
                <USelect
                  v-model="newNested.type"
                  :items="fieldTypes"
                  class="flex-1"
                />
                <UButton
                  size="xs"
                  @click="addNestedField"
                >
                  Add
                </UButton>
                <UButton
                  size="xs"
                  variant="ghost"
                  @click="addingNested = false"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="hasItemChildren"
          class="space-y-3 pt-2"
        >
          <h3 class="text-xs font-semibold uppercase text-muted tracking-wide">
            Array item fields
          </h3>
          <div class="space-y-2">
            <div
              v-for="(nested, idx) in itemChildFields"
              :key="nested.name"
              class="grid grid-cols-3 gap-3 items-end"
            >
              <UFormField :label="idx === 0 ? 'Name' : undefined">
                <UInput
                  :model-value="nested.name"
                  disabled
                />
              </UFormField>
              <UFormField :label="idx === 0 ? 'Title' : undefined">
                <UInput
                  :model-value="nested.title"
                  :disabled="readonly"
                  @update:model-value="v => updateNestedField(idx, { ...nested, title: v })"
                />
              </UFormField>
              <div class="flex items-end gap-2">
                <UFormField
                  class="flex-1"
                  :label="idx === 0 ? 'Type' : undefined"
                >
                  <USelect
                    :model-value="nested.type"
                    :items="fieldTypes"
                    :disabled="readonly"
                    @update:model-value="v => updateNestedField(idx, { ...nested, type: v })"
                  />
                </UFormField>
                <UButton
                  v-if="!readonly"
                  icon="i-lucide-trash"
                  size="sm"
                  variant="ghost"
                  color="error"
                  @click="removeNestedField(idx)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="!readonly"
            class="rounded border border-dashed border-default p-3"
          >
            <div v-if="!addingNested">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="ghost"
                @click="addingNested = true"
              >
                Add nested field
              </UButton>
            </div>
            <div
              v-else
              class="grid grid-cols-3 gap-3 items-end"
            >
              <UInput
                v-model="newNested.name"
                placeholder="name"
              />
              <UInput
                v-model="newNested.title"
                placeholder="title"
              />
              <div class="flex items-end gap-2">
                <USelect
                  v-model="newNested.type"
                  :items="fieldTypes"
                  class="flex-1"
                />
                <UButton
                  size="xs"
                  @click="addNestedField"
                >
                  Add
                </UButton>
                <UButton
                  size="xs"
                  variant="ghost"
                  @click="addingNested = false"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UButton
        v-if="!readonly"
        icon="i-lucide-trash"
        size="sm"
        variant="ghost"
        color="error"
        @click="emit('remove')"
      />
    </div>
  </div>
</template>
