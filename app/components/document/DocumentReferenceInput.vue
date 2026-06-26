<script setup lang="ts">
const props = defineProps<{
  modelValue: { _type: string, _ref: string } | undefined
  to?: Array<{ type: string }>
  dataset?: string
  name?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { _type: string, _ref: string }]
}>()

const refTypes = computed(() => props.to?.map(t => t.type) || [])

const { data: allDocs } = useFetch('/api/documents', {
  query: computed(() => ({ limit: 1000 }))
})

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

const referenceOptions = computed(() => {
  const docs = allDocs.value?.documents || []
  return docs
    .filter(d => refTypes.value.length === 0 || refTypes.value.includes(d._type as string))
    .map(d => ({ label: `${d._type}: ${previewTitle(d)}`, value: d._id as string }))
})

const selected = computed({
  get: () => {
    if (!props.modelValue?._ref) return undefined
    return referenceOptions.value.find(o => o.value === props.modelValue!._ref)
  },
  set: (v) => {
    emit('update:modelValue', { _type: 'reference', _ref: v?.value || '' })
  }
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    :items="referenceOptions"
    :name="name"
    placeholder="Select reference"
  />
</template>
