<script setup lang="ts">
import type { MediaAsset, MediaListResponse } from '~/types/media'

const props = defineProps<{
  open: boolean
  type?: 'image' | 'file'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'select': [asset: MediaAsset]
}>()

const currentDataset = useCurrentDataset()
const search = ref('')

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const { data, refresh, status } = await useFetch<MediaListResponse>('/api/media', {
  query: computed(() => ({
    dataset: currentDataset.value,
    search: search.value,
    type: props.type === 'image' ? 'sanity.imageAsset' : props.type === 'file' ? 'sanity.fileAsset' : undefined,
    limit: 100,
    offset: 0
  }))
})

const assets = computed<MediaAsset[]>(() => (data.value?.assets || []) as unknown as MediaAsset[])

function isImage(asset: MediaAsset) {
  return asset._type === 'sanity.imageAsset' || (asset.mimeType ?? '').startsWith('image/')
}

function selectAsset(asset: MediaAsset) {
  emit('select', asset)
  isOpen.value = false
}

watch(() => props.open, (open) => {
  if (open) refresh()
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-6xl rounded-lg shadow-lg ring ring-default'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold">
          Select asset
        </h2>
      </div>
    </template>

    <template #body>
      <div class="flex items-center gap-2 mb-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search assets..."
          class="w-full"
        />
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          @click="() => refresh()"
        />
      </div>

      <div
        v-if="status === 'pending'"
        class="text-center text-muted py-12"
      >
        Loading...
      </div>

      <div
        v-else-if="assets.length === 0"
        class="text-center text-muted py-12"
      >
        No assets found
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        <div
          v-for="asset in assets"
          :key="asset._id"
          class="group cursor-pointer rounded-lg border border-default bg-elevated/25 overflow-hidden hover:ring-2 hover:ring-primary/50 transition"
          @click="selectAsset(asset)"
        >
          <div class="aspect-square bg-elevated/50 flex items-center justify-center overflow-hidden">
            <img
              v-if="isImage(asset) && asset.url"
              :src="asset.url"
              class="w-full h-full object-cover"
              :alt="asset.altText || asset.originalFilename || ''"
            >
            <UIcon
              v-else
              name="i-lucide-file"
              class="size-12 text-muted"
            />
          </div>
          <div class="p-2 space-y-1">
            <div class="text-sm truncate font-medium">
              {{ asset.originalFilename || asset._filename || asset._id }}
            </div>
            <div class="text-xs text-muted truncate">
              {{ asset._resolution || asset.mimeType || asset._type }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="isOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
