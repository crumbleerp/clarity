<script setup lang="ts">
import type { FieldDef, ValidationError } from '~/utils/validation'

const props = withDefaults(defineProps<{
  modelValue: Record<string, unknown> | undefined
  fields: FieldDef[]
  dataset?: string
  readonly?: boolean
  errors?: ValidationError[]
}>(), {
  readonly: false,
  errors: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const data = computed({
  get: () => props.modelValue || {},
  set: v => emit('update:modelValue', v)
})

function updateField(name: string, value: unknown) {
  data.value = { ...data.value, [name]: value }
}

function getFieldErrors(field: FieldDef): ValidationError[] {
  return props.errors?.filter(e => e.field === field.name) ?? []
}
</script>

<template>
  <div class="space-y-2">
    <SchemaFormField
      v-for="field in fields"
      :key="field.name"
      :field="field"
      :model-value="data[field.name]"
      :dataset="dataset"
      :readonly="readonly"
      :errors="getFieldErrors(field)"
      @update:model-value="(v: unknown) => updateField(field.name, v)"
    />
  </div>
</template>
