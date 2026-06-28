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

const props = withDefaults(defineProps<{
  field: FieldDef
  modelValue: unknown
  dataset?: string
  hideLabel?: boolean
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const UFormFieldComponent = resolveComponent('UFormField')

const wrapper = computed(() => props.hideLabel ? 'div' : UFormFieldComponent)
const wrapperProps = computed(() => props.hideLabel
  ? {}
  : { label: props.field.title || props.field.name, name: props.field.name, description: props.field.description }
)

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

const isArrayField = computed(() => props.field.type === 'array' || Array.isArray(props.field.of))

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
    <component
      :is="wrapper"
      v-if="field.type === 'boolean'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <USwitch
        v-model="valueBoolean"
        :name="field.name"
        :disabled="readonly"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'text'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <UTextarea
        v-model="valueString"
        :name="field.name"
        :disabled="readonly"
        :rows="4"
        class="font-mono text-sm w-full"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="['markdown', 'html'].includes(field.type)"
      v-bind="wrapperProps"
      class="w-full"
    >
      <div class="w-full h-100 border overflow-hidden">
        <EditorRichEditor
          v-model="valueString"
          :type="editorType"
          class="w-full h-full"
        />
      </div>
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'number'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <UInput
        v-model="valueNumber"
        class="w-full"
        :name="field.name"
        :disabled="readonly"
        type="number"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'color'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <div class="flex items-center gap-2">
        <UInput
          v-model="valueString"
          :name="field.name"
          :disabled="readonly"
          type="color"
          class="w-full"
        />
        <UInput
          v-model="valueString"
          class="w-full"
          :name="field.name"
          :disabled="readonly"
          type="text"
          placeholder="#000000"
        />
      </div>
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'reference'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <DocumentReferenceInput
        v-model="valueReference"
        class="w-full"
        :to="field.to"
        :dataset="dataset"
        :name="field.name"
        :readonly="readonly"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'image' || field.type === 'file'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <DocumentAssetInput
        v-model="valueAsset"
        :type="field.type"
        :name="field.name"
        :dataset="dataset"
        :readonly="readonly"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="isArrayField"
      v-bind="wrapperProps"
      class="w-full"
    >
      <UCard
        :ui="{ body: 'p-0!' }"
        class="bg-elevated/25"
      >
        <div
          v-for="(item, idx) in ensureArray()"
          :key="idx"
          class="flex items-start gap-2 p-2"
          :class="{ 'border-b border-default': idx < ensureArray().length - 1 }"
        >
          <div class="flex-1 min-w-0">
            <DocumentArrayItem
              :field="(field.of?.[0] || { name: 'item', type: 'string' })"
              :model-value="item"
              :dataset="dataset"
              :readonly="readonly"
              @update:model-value="v => updateArrayItem(idx, v)"
            />
          </div>
          <UButton
            v-if="!readonly"
            icon="i-lucide-trash"
            size="sm"
            color="error"
            variant="ghost"
            @click="removeArrayItem(idx)"
          />
        </div>
      </UCard>

      <UButton
        v-if="!readonly"
        icon="i-lucide-plus"
        size="sm"
        variant="ghost"
        :label="`Add ${field.title || field.name || 'item'}`"
        @click="addArrayItem"
      />
    </component>

    <component
      :is="wrapper"
      v-else-if="field.type === 'object' || field.type === 'document'"
      v-bind="wrapperProps"
      class="w-full"
    >
      <UCard class="bg-elevated/25">
        <DocumentObjectForm
          v-if="field.fields?.length"
          v-model="valueObject"
          :fields="field.fields"
          :dataset="dataset"
          :readonly="readonly"
        />
      </UCard>
    </component>

    <component
      :is="wrapper"
      v-else
      v-bind="wrapperProps"
      class="w-full"
    >
      <UInput
        v-model="valueString"
        class="w-full"
        :name="field.name"
        :disabled="readonly"
        :type="pickInputType()"
      />
    </component>
  </div>
</template>
