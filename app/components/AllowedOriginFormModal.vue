<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [origin: string]
}>()

const state = reactive({
  origin: ''
})

watch(() => props.open, (open) => {
  if (open) state.origin = ''
})

function onSubmit() {
  emit('submit', state.origin.trim())
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    title="New Allowed Origin"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Origin"
          name="origin"
        >
          <UInput
            v-model="state.origin"
            placeholder="https://example.com"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            variant="ghost"
            @click="emit('update:open', false)"
          />
          <UButton
            type="submit"
            label="Add"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
