<script setup lang="ts">
import type { FieldDef } from './SchemaFormField.vue'

const props = defineProps<{
  field: FieldDef
  modelValue: unknown
  dataset?: string
  hideLabel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const open = ref(false)

const shouldHideLabel = computed(() =>
  props.field.name === 'unknown'
  || props.field.title === 'Unknown'
  || props.field.title === ''
)

const isObject = computed(() =>
  props.field.type === 'document'
  || (props.field.type === 'object' && (props.field.fields?.length ?? 0) > 0)
)

const item = computed({
  get: () => (props.modelValue || {}) as Record<string, unknown>,
  set: (v: Record<string, unknown>) => emit('update:modelValue', v)
})

function previewTitle(): string {
  if (!isObject.value) {
    return props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)
  }

  const value = item.value
  const candidates = (props.field.fields || []).filter((f: FieldDef) =>
    ['name', 'title', 'label', 'heading'].includes(f.name)
  ).concat(props.field.fields || [])

  for (const field of candidates) {
    const raw = value[field.name]
    if (raw === undefined || raw === null) continue

    if (typeof raw === 'string') return raw

    if (typeof raw === 'object') {
      const localized = raw as Record<string, unknown>
      if (localized.en !== undefined) return String(localized.en)
      const first = Object.values(localized).find(v => v !== undefined && v !== null)
      if (first !== undefined) return String(first)
      return JSON.stringify(raw).slice(0, 60)
    }

    return String(raw)
  }

  return props.field.title || props.field.name || 'Item'
}

function previewSubtitle(): string {
  if (!isObject.value) return ''
  const parts: string[] = []
  for (const f of props.field.fields?.slice(0, 3) ?? []) {
    if (['name', 'title', 'label', 'heading'].includes(f.name)) continue
    const raw = item.value[f.name]
    if (raw === undefined || raw === null) continue
    const label = f.title || f.name
    let text = ''
    if (typeof raw === 'string') text = raw
    else if (Array.isArray(raw)) text = `${raw.length} items`
    else if (typeof raw === 'object') text = JSON.stringify(raw).slice(0, 40)
    else text = String(raw)
    parts.push(`${label}: ${text}`)
  }
  return parts.join(' · ').slice(0, 120)
}
</script>

<template>
  <div v-if="!isObject">
    <SchemaFormField
      :field="field"
      :model-value="modelValue"
      :dataset="dataset"
      :hide-label="shouldHideLabel"
      @update:model-value="v => emit('update:modelValue', v)"
    />
  </div>

  <USlideover
    v-else
    v-model:open="open"
    :title="field.title || field.name"
    side="right"
    class="w-full"
  >
    <button
      type="button"
      class="w-full flex items-center gap-3 p-2 text-left hover:bg-elevated/50 transition-colors rounded-md"
    >
      <UIcon
        name="i-lucide-file-text"
        class="size-5 text-default-foreground/60"
      />
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">
          {{ previewTitle() }}
        </div>
        <div
          v-if="previewSubtitle()"
          class="text-xs text-default-foreground/50 truncate"
        >
          {{ previewSubtitle() }}
        </div>
      </div>
    </button>

    <template #body>
      <DocumentObjectForm
        v-model="item"
        :fields="field.fields!"
        :dataset="dataset"
      />
    </template>
  </USlideover>
</template>
