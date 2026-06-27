<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { Codemirror } from 'vue-codemirror'

const toast = useToast()
const currentDataset = useCurrentDataset()

const { data: schemas, refresh } = await useFetch('/api/schemas', {
  query: computed(() => ({ dataset: currentDataset.value }))
})

const input = ref('')
const editing = ref<Record<string, unknown> | null>(null)

watch(currentDataset, () => refresh())

async function saveSchemas() {
  try {
    const parsed = JSON.parse(input.value)
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    await $fetch('/api/schemas', {
      method: 'POST',
      body: arr,
      query: { dataset: currentDataset.value }
    })
    toast.add({ title: 'Schemas saved', color: 'success' })
    input.value = ''
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteSchema(name: string) {
  await $fetch(`/api/schemas/${name}`, {
    method: 'DELETE',
    query: { dataset: currentDataset.value }
  })
  toast.add({ title: `Schema "${name}" deleted`, color: 'success' })
  await refresh()
}

function editSchema(schema: Record<string, unknown>) {
  editing.value = schema
  input.value = JSON.stringify([schema], null, 2)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UCard :ui="{ body: 'p-0!' }">
      <template #header>
        <h3 class="font-semibold">
          {{ editing ? 'Edit Schema' : 'Add Schema' }}
        </h3>
      </template>

      <div class="w-full h-50">
        <Codemirror
          v-model="input"
          :extensions="[json()]"
          :style="{ height: '100%', width: '100%' }"
        />
      </div>

      <div class="flex gap-2 p-2 justify-end border-t">
        <UButton
          label="Save"
          icon="i-lucide-save"
          color="secondary"
          @click="saveSchemas"
        />
        <UButton
          v-if="editing"
          label="Cancel"
          variant="ghost"
          color="secondary"
          @click="editing = null; input = ''"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">
          Registered Schemas
        </h3>
      </template>

      <div
        v-if="schemas?.length === 0"
        class="text-muted py-8 text-center"
      >
        No schemas yet
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="schema in schemas"
          :key="schema.id"
          class="flex items-center justify-between p-3 rounded-lg border border-default"
        >
          <div>
            <div class="font-medium">
              {{ schema.title }}
            </div>
            <div class="text-sm text-muted">
              {{ schema.name }} · {{ (schema.fields as unknown[])?.length || 0 }} fields
            </div>
          </div>
          <div class="flex gap-1">
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              variant="ghost"
              @click="editSchema(schema as unknown as Record<string, unknown>)"
            />
            <UButton
              icon="i-lucide-trash"
              size="sm"
              color="error"
              variant="ghost"
              @click="deleteSchema(schema.name)"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  background-color: var(--ui-bg);
  height: 100%;
  :deep(.ͼe) {
    color: var(--color-yellow-100)
  }
  :deep(.ͼd) {
    color: var(--color-green-100)
  }
  :deep(.ͼc) {
    color: #569cd6;
  }
}

:deep(.cm-content) {
  color: var(--ui-text);
}

:deep(.cm-gutters) {
  background-color: var(--ui-bg-elevated) !important;
  border-right-color: var(--ui-border) !important;
}

:deep(.cm-activeLineGutter) {
  background-color: var(--ui-bg-elevated) !important;
}

:deep(.jv-node) {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0px !important;
}

:deep(.jv-control-btn) {
  background: var(--ui-secondary) !important;
  border: none !important;
  color: var(--ui-text-inverted) !important;
  font-family: "Google Sans" !important;
  padding: 2px 8px !important;
}
</style>
