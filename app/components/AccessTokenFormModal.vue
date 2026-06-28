<script setup lang="ts">
export interface AccessTokenFormData {
  name: string
  role: 'root' | 'admin' | 'moderator' | 'guest'
  expiresAt: string
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: AccessTokenFormData]
}>()

const { assignableRoles } = usePermissions()

const state = reactive<AccessTokenFormData>({
  name: '',
  role: 'guest',
  expiresAt: ''
})

const selectedRole = computed({
  get: () => assignableRoles.value.find(o => o.value === state.role) || assignableRoles.value[0],
  set: (v) => { state.role = v?.value as 'root' | 'admin' | 'moderator' | 'guest' || 'guest' }
})

watch(() => props.open, (open) => {
  if (open) {
    state.name = ''
    state.role = (assignableRoles.value.find(o => o.value === 'guest')?.value || assignableRoles.value[0]?.value || 'guest') as AccessTokenFormData['role']
    state.expiresAt = ''
  }
})

function onSubmit() {
  if (assignableRoles.value.length === 0) return
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
          v-if="assignableRoles.length"
          label="Role"
          name="role"
        >
          <USelectMenu
            v-model="selectedRole"
            :items="assignableRoles"
          />
        </UFormField>

        <div
          v-if="assignableRoles.length === 0"
          class="text-sm text-muted"
        >
          You do not have permission to assign roles.
        </div>

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
            :disabled="assignableRoles.length === 0"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
