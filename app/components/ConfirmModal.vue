<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  confirmColor?: 'primary' | 'error' | 'warning'
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ description }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click="isOpen = false"
        >
          Cancel
        </UButton>
        <UButton
          :color="confirmColor || 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel || 'Confirm' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
