<script setup lang="ts">
const toast = useToast()
const currentDataset = useCurrentDataset()

const { data: trashed, refresh } = await useFetch('/api/documents/trash', {
  query: computed(() => ({ dataset: currentDataset.value }))
})

async function restore(id: string) {
  try {
    await $fetch(`/api/documents/${id}/restore`, {
      method: 'POST',
      query: { dataset: currentDataset.value }
    })
    toast.add({ title: 'Document restored', color: 'success' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function emptyTrash() {
  try {
    await $fetch('/api/documents/trash', {
      method: 'DELETE',
      query: { dataset: currentDataset.value }
    })
    toast.add({ title: 'Trash emptied', color: 'success' })
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <UCard variant="outline" :ui="{ body: 'p-0!' }">
    <div class="flex items-center justify-between px-6 py-4">
      <div>
        <h3 class="font-medium">
          Trash
        </h3>
        <p class="text-sm text-muted mt-1">
          Deleted documents are kept here until permanently removed.
        </p>
      </div>
      <UButton
        label="Empty Trash"
        icon="i-lucide-trash-2"
        color="error"
        size="sm"
        :disabled="!trashed?.documents?.length"
        @click="emptyTrash"
      />
    </div>

    <div
      v-if="!trashed?.documents?.length"
      class="p-8 text-center text-muted text-sm"
    >
      Trash is empty
    </div>

    <div
      v-else
      class="divide-y border-t"
    >
      <div
        v-for="doc in trashed.documents"
        :key="doc._id as string"
        class="flex items-center justify-between px-6 py-4"
      >
        <div>
          <div class="font-medium text-sm">
            {{ ((doc as Record<string, unknown>).title as string) || ((doc as Record<string, unknown>).name as string) || doc._id }}
          </div>
          <div class="text-xs text-muted">
            {{ doc._type }} · deleted {{ new Date(doc._deletedAt as string).toLocaleString() }}
          </div>
        </div>
        <UButton
          label="Restore"
          icon="i-lucide-rotate-ccw"
          size="xs"
          variant="ghost"
          @click="restore(doc._id as string)"
        />
      </div>
    </div>
  </UCard>
</template>
