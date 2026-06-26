<script setup lang="ts">
export interface UserFormData {
  id?: string
  username: string
  password: string
  role: 'root' | 'admin' | 'moderator' | 'guest'
}

const props = defineProps<{
  open: boolean
  user: UserFormData | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: UserFormData]
}>()

const isEdit = computed(() => !!props.user?.id)
const isRoot = computed(() => props.user?.role === 'root')

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Guest', value: 'guest' }
]

const state = reactive<UserFormData>({
  username: '',
  password: '',
  role: 'guest'
})

const selectedRole = computed({
  get: () => roleOptions.find(o => o.value === state.role) || roleOptions[2],
  set: (v) => { state.role = v?.value as 'admin' | 'moderator' | 'guest' || 'guest' }
})

watch(() => props.user, (v) => {
  state.username = v?.username || ''
  state.password = ''
  state.role = v?.role || 'guest'
}, { immediate: true })

function onSubmit() {
  emit('submit', { ...props.user, ...state } as UserFormData)
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="isEdit ? 'Edit User' : 'Create User'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Username"
          name="username"
        >
          <UInput v-model="state.username" />
        </UFormField>

        <UFormField
          :label="isEdit ? 'New Password (leave empty to keep)' : 'Password'"
          name="password"
        >
          <UInput
            v-model="state.password"
            type="password"
          />
        </UFormField>

        <UFormField
          v-if="!isRoot"
          label="Role"
          name="role"
        >
          <USelectMenu
            v-model="selectedRole"
            :items="roleOptions"
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
            :label="isEdit ? 'Save' : 'Create'"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
