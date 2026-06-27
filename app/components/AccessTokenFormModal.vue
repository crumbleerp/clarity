<script setup lang="ts">
export interface AccessTokenFormData {
  name: string
  role: 'root' | 'admin' | 'moderator' | 'guest'
  expiresAt: string
}

const props = defineProps<{
  open: boolean
  allowRoot?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: AccessTokenFormData]
}>()

const roleOptions = computed(() => {
  const options = [
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Guest', value: 'guest' }
  ]
  if (props.allowRoot) {
    options.unshift({ label: 'Root', value: 'root' })
  }
  return options
})

const state = reactive<AccessTokenFormData>({
  name: '',
  role: 'guest',
  expiresAt: ''
})

const selectedRole = computed({
  get: () => roleOptions.value.find(o => o.value === state.role) || roleOptions.value[roleOptions.value.length - 1],
  set: (v) => { state.role = v?.value as 'root' | 'admin' | 'moderator' | 'guest' || 'guest' }
})

watch(() => props.open, (open) => {
  if (open) {
    state.name = ''
    state.role = 'guest'
    state.expiresAt = ''
  }
})

function onSubmit() {
  emit('submit', { ...state })
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    title="New Access Token"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
        >
          <UInput v-model="state.name" />
        </UFormField>

        <UFormField
          label="Role"
          name="role"
        >
          <USelectMenu
            v-model="selectedRole"
            :items="roleOptions"
          />
        </UFormField>

        <UFormField
          label="Expires At"
          name="expiresAt"
        >
          <UInput
            v-model="state.expiresAt"
            type="datetime-local"
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
            label="Create"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
