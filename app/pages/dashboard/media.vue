<script setup lang="ts">
import type { MediaAsset, MediaListResponse } from '~/types/media'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const route = useRoute()
const router = useRouter()
const currentDataset = useCurrentDataset()

const search = ref((route.query.search as string) || '')
const typeFilter = ref<'all' | 'image' | 'file'>((route.query.type as 'all' | 'image' | 'file') || 'all')
const selectedId = ref<string>((route.query.id as string) || '')

const { data, refresh, status } = await useFetch<MediaListResponse>('/api/media', {
  query: computed(() => ({
    dataset: currentDataset.value,
    search: search.value,
    type: typeFilter.value === 'all' ? undefined : typeFilter.value === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
    limit: 100,
    offset: 0
  }))
})

const assets = computed<MediaAsset[]>(() => (data.value?.assets || []) as unknown as MediaAsset[])

const selectedAsset = computed<MediaAsset | undefined>(() => {
  return assets.value.find(a => a._id === selectedId.value)
})

const modalOpen = computed({
  get: () => !!selectedId.value,
  set: (value) => {
    if (!value) {
      selectedId.value = ''
      router.push({ query: { ...route.query, id: undefined } })
    }
  }
})

function openAsset(id: string) {
  selectedId.value = id
  router.push({ query: { ...route.query, id } })
}

function isImage(asset: MediaAsset) {
  return asset._type === 'sanity.imageAsset' || (asset.mimeType ?? '').startsWith('image/')
}

function updateSearch() {
  router.push({ query: { ...route.query, search: search.value || undefined } })
}

async function saveAsset(payload: Partial<MediaAsset>) {
  if (!selectedId.value) return
  try {
    await $fetch(`/api/media/${selectedId.value}`, {
      method: 'PUT',
      body: payload
    })
    toast.add({ title: 'Asset saved', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}

async function deleteAsset() {
  if (!selectedId.value) return
  try {
    await $fetch(`/api/media/${selectedId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Asset deleted', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-xl font-semibold">
        Media
      </h1>

      <div class="flex items-center gap-2">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search assets..."
          class="w-64"
          @keyup.enter="updateSearch"
        />
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          @click="updateSearch"
        />
      </div>
    </div>

    <div class="flex gap-2 border-b border-default pb-2">
      <UButton
        :variant="typeFilter === 'all' ? 'subtle' : 'ghost'"
        :color="typeFilter === 'all' ? 'secondary' : 'neutral'"
        @click="typeFilter = 'all'"
      >
        All
      </UButton>
      <UButton
        :variant="typeFilter === 'image' ? 'subtle' : 'ghost'"
        :color="typeFilter === 'image' ? 'secondary' : 'neutral'"
        @click="typeFilter = 'image'"
      >
        Images
      </UButton>
      <UButton
        :variant="typeFilter === 'file' ? 'subtle' : 'ghost'"
        :color="typeFilter === 'file' ? 'secondary' : 'neutral'"
        @click="typeFilter = 'file'"
      >
        Files
      </UButton>
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
      class="grid grid-cols-4 gap-4"
    >
      <div
        v-for="asset in assets"
        :key="asset._id"
        class="group cursor-pointer rounded-lg border border-default bg-elevated/25 overflow-hidden hover:ring-2 hover:ring-primary/50 transition"
        @click="openAsset(asset._id)"
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

    <MediaAssetModal
      v-model:open="modalOpen"
      :asset="selectedAsset"
      @save="saveAsset"
      @delete="deleteAsset"
    />
  </div>
</template>
