<script setup lang="ts">
import type { FieldDef } from '../SchemaFormField.vue'

const props = defineProps<{
  modelValue: Record<string, unknown> | undefined
  fields: FieldDef[]
  dataset?: string
}>()

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
</script>

<template>
  <div class="space-y-4">
    <SchemaFormField
      v-for="field in fields"
      :key="field.name"
      :field="field"
      :model-value="data[field.name]"
      :dataset="dataset"
      @update:model-value="(v: unknown) => updateField(field.name, v)"
    />
  </div>
</template>
