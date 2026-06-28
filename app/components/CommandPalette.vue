<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const currentDataset = useCurrentDataset()

const open = ref(false)
const search = ref('')
const selectedIndex = ref(0)

const { data: results, status } = useFetch('/api/search', {
  query: computed(() => ({
    dataset: currentDataset.value,
    q: search.value
  })),
  watch: [search],
  immediate: false
})

const items = computed(() => {
  const list: { label: string, suffix: string, icon: string, to: string }[] = []

  for (const doc of results.value?.documents || []) {
    list.push({
      label: doc.title,
      suffix: `${doc.type} · ${doc.status}`,
      icon: 'i-lucide-file-text',
      to: `/dashboard/documents?type=${encodeURIComponent(doc.type)}&id=${encodeURIComponent(doc.id)}`
    })
  }

  for (const schema of results.value?.schemas || []) {
    list.push({
      label: schema.title,
      suffix: schema.name,
      icon: 'i-lucide-folder',
      to: `/dashboard/settings`
    })
  }

  return list
})

watch(items, () => {
  selectedIndex.value = 0
})

function select(item: { to: string }) {
  open.value = false
  search.value = ''
  router.push(item.to)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open.value = !open.value
    return
  }

  if (!open.value) return

  if (e.key === 'Escape') {
    open.value = false
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % items.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + items.value.length) % items.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = items.value[selectedIndex.value]
    if (item) select(item)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

watch(() => route.path, () => {
  open.value = false
})
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="true"
    :ui="{ content: 'w-[32rem]' }"
  >
    <template #content>
      <div class="p-2">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search documents and schemas..."
          class="w-full"
          autocomplete="off"
        />

        <div class="mt-2 max-h-80 overflow-y-auto">
          <div
            v-if="status === 'pending'"
            class="p-4 text-center text-muted text-sm"
          >
            Searching...
          </div>
          <div
            v-else-if="search.length < 2"
            class="p-4 text-center text-muted text-sm"
          >
            Type at least 2 characters
          </div>
          <div
            v-else-if="items.length === 0"
            class="p-4 text-center text-muted text-sm"
          >
            No results
          </div>
          <button
            v-for="(item, idx) in items"
            :key="item.to + idx"
            class="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors"
            :class="idx === selectedIndex ? 'bg-secondary/10 text-secondary' : 'hover:bg-elevated'"
            @click="select(item)"
          >
            <UIcon
              :name="item.icon"
              class="size-4"
            />
            <div class="flex-1 min-w-0">
              <div class="truncate">
                {{ item.label }}
              </div>
              <div class="text-xs text-muted truncate">
                {{ item.suffix }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
