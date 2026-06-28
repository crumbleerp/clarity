<script setup lang="ts">
const currentDataset = useCurrentDataset()

const exporting = ref(false)

async function exportAll() {
  exporting.value = true
  try {
    const data = await $fetch<{ result: unknown }>(`/v1/data/query/${currentDataset.value}?query=${encodeURIComponent('*')}`)

    const blob = new Blob([JSON.stringify(data.result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clarity-${currentDataset.value}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <UCard variant="outline">
    <template #header>
      <h3 class="font-semibold">
        Export
      </h3>
    </template>

    <p class="text-sm text-muted mb-4">
      Download all documents in the current dataset as JSON using a GROQ <code>*</code> query.
    </p>

    <UButton
      label="Export dataset as JSON"
      icon="i-lucide-download"
      color="secondary"
      :loading="exporting"
      :disabled="exporting"
      @click="exportAll"
    />
  </UCard>
</template>
