<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const creating = ref(false)
const creatingLoading = ref(false)
const newName = ref('')

const { data, refresh } = useFetch('/api/datasets')

const datasets = computed(() => {
  const list = new Set(data.value?.datasets || [])
  if (props.modelValue) list.add(props.modelValue)
  return Array.from(list).sort()
})

function select(name: string) {
  emit('update:modelValue', name)
  open.value = false
  creating.value = false
  newName.value = ''
}

function startCreate() {
  creating.value = true
}

function cancelCreate() {
  creating.value = false
  newName.value = ''
}

async function confirmCreate() {
  const name = newName.value.trim().toLowerCase().replace(/\s+/g, '-')
  if (!name) return
  if (!/^[a-z0-9_-]+$/.test(name)) return

  creatingLoading.value = true
  try {
    await $fetch('/api/datasets', { method: 'POST', body: { name } })
    await refresh()
    select(name)
  } finally {
    creatingLoading.value = false
  }
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'bottom', align: 'start' }"
  >
    <UButton
      :label="modelValue"
      icon="i-lucide-database"
      trailing-icon="i-lucide-chevron-down"
      color="neutral"
      variant="outline"
      size="md"
    />

    <template #content>
      <div class="w-56 p-1">
        <div v-if="!creating">
          <button
            v-for="name in datasets"
            :key="name"
            class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between"
            :class="name === modelValue ? 'bg-secondary/10 text-secondary font-medium' : 'hover:bg-elevated'"
            @click="select(name)"
          >
            <span>{{ name }}</span>
            <UIcon
              v-if="name === modelValue"
              name="i-lucide-check"
              class="size-4"
            />
          </button>

          <div class="border-t border-default my-1" />

          <button
            class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 text-secondary hover:bg-secondary/10"
            @click="startCreate"
          >
            <UIcon
              name="i-lucide-plus"
              class="size-4"
            />
            <span>New dataset</span>
          </button>
        </div>

        <div
          v-else
          class="p-2 space-y-2"
        >
          <UInput
            v-model="newName"
            placeholder="dataset-name"
            size="sm"
            @keydown.enter="confirmCreate"
          />
          <div class="flex gap-2">
            <UButton
              size="xs"
              class="flex-1"
              :loading="creatingLoading"
              @click="confirmCreate"
            >
              Create
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              @click="cancelCreate"
            >
              Cancel
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
