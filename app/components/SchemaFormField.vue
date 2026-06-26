<script setup lang="ts">
export interface FieldDef {
  name: string
  title?: string
  type: string
  description?: string
  options?: Record<string, unknown>
  fields?: FieldDef[]
  of?: FieldDef[]
  to?: Array<{ type: string }>
  validation?: unknown
}

const props = defineProps<{
  field: FieldDef
  modelValue: unknown
  dataset?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

function typedValue<T>() {
  return computed({
    get: () => props.modelValue as T,
    set: (v: T) => emit('update:modelValue', v)
  })
}

const valueBoolean = typedValue<boolean>()
const valueString = typedValue<string>()
const editorType = computed(() => props.field.type as 'html' | 'markdown')
const valueNumber = typedValue<number>()
const valueReference = typedValue<{ _type: string, _ref: string } | undefined>()
const valueAsset = typedValue<{ _type: string, asset?: { _ref: string } } | undefined>()
const valueObject = typedValue<Record<string, unknown>>()

function pickInputType() {
  switch (props.field.type) {
    case 'url': return 'url'
    case 'email': return 'email'
    case 'date': return 'date'
    case 'datetime': return 'datetime-local'
    case 'slug': return 'text'
    default: return 'text'
  }
}

function ensureArray(): unknown[] {
  return Array.isArray(value.value) ? [...value.value] : []
}

function addArrayItem() {
  const arr = ensureArray()
  const itemType = props.field.of?.[0]?.type || 'string'
  let item: unknown
  if (itemType === 'object' || itemType === 'document') {
    item = { _key: crypto.randomUUID() }
  } else if (itemType === 'reference') {
    item = { _type: 'reference', _ref: '' }
  } else if (itemType === 'image') {
    item = { _type: 'image', asset: { _type: 'reference', _ref: '' } }
  } else if (itemType === 'block') {
    item = { _key: crypto.randomUUID(), _type: 'block', children: [{ _type: 'span', text: '' }] }
  } else {
    item = ''
  }
  value.value = [...arr, item]
}

function removeArrayItem(index: number) {
  const arr = ensureArray()
  arr.splice(index, 1)
  value.value = [...arr]
}

function updateArrayItem(index: number, v: unknown) {
  const arr = ensureArray()
  arr[index] = v
  value.value = [...arr]
}
</script>

<template>
  <div class="schema-field">
    <UFormField
      v-if="field.type === 'boolean'"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <USwitch
        v-model="valueBoolean"
        :name="field.name"
      />
    </UFormField>

    <UFormField
      v-else-if="field.type === 'text'"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <UTextarea
        v-model="valueString"
        :name="field.name"
        :rows="4"
        class="font-mono text-sm w-full"
      />
    </UFormField>

    <UFormField
      v-else-if="['markdown', 'html'].includes(field.type)"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <RichEditor
        v-model="valueString"
        :type="editorType"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-else-if="field.type === 'number'"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <UInput
        v-model="valueNumber"
        class="w-full"
        :name="field.name"
        type="number"
      />
    </UFormField>

    <UFormField
      v-else-if="field.type === 'color'"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <div class="flex items-center gap-2">
        <UInput
          v-model="valueString"
          :name="field.name"
          type="color"
          class="w-full"
        />
        <UInput
          v-model="valueString"
          class="w-full"
          :name="field.name"
          type="text"
          placeholder="#000000"
        />
      </div>
    </UFormField>

    <UFormField
      v-else-if="field.type === 'reference'"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <DocumentReferenceInput
        v-model="valueReference"
        class="w-full"
        :to="field.to"
        :dataset="dataset"
        :name="field.name"
      />
    </UFormField>

    <UFormField
      v-else-if="field.type === 'image' || field.type === 'file'"
      class="w-full"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <DocumentAssetInput
        v-model="valueAsset"
        :type="field.type"
        :name="field.name"
        :dataset="dataset"
      />
    </UFormField>

    <UFormField
      v-else-if="field.type === 'object'"
      class="w-full"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <UCard class="p-4 bg-elevated/25">
        <DocumentObjectForm
          v-if="field.fields?.length"
          v-model="valueObject"
          :fields="field.fields"
          :dataset="dataset"
        />
      </UCard>
    </UFormField>

    <UFormField
      v-else-if="field.type === 'array'"
      class="w-full"
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <div class="space-y-2">
        <div
          v-for="(item, idx) in ensureArray()"
          :key="idx"
          class="flex items-start gap-2 rounded-lg border border-default bg-elevated/25 p-2"
        >
          <div class="flex-1 min-w-0">
            <DocumentArrayItem
              :field="(field.of?.[0] || { name: 'item', type: 'string' })"
              :model-value="item"
              :dataset="dataset"
              @update:model-value="v => updateArrayItem(idx, v)"
            />
          </div>
          <UButton
            icon="i-lucide-trash"
            size="sm"
            color="error"
            variant="ghost"
            @click="removeArrayItem(idx)"
          />
        </div>

        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="ghost"
          :label="`Add ${field.title || field.name || 'item'}`"
          @click="addArrayItem"
        />
      </div>
    </UFormField>

    <UFormField
      v-else
      :label="field.title || field.name"
      :name="field.name"
      :description="field.description"
    >
      <UInput
        v-model="valueString"
        class="w-full"
        :name="field.name"
        :type="pickInputType()"
      />
    </UFormField>
  </div>
</template>
