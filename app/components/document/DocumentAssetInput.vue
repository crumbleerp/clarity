<script setup lang="ts">
import type { MediaAsset } from '~/types/media'

const props = withDefaults(defineProps<{
  modelValue: { _type: string, asset?: { _ref: string } } | undefined
  type: 'image' | 'file'
  name?: string
  dataset?: string
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: { _type: string, asset?: { _ref: string } }]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragging = ref(false)
const selectOpen = ref(false)
const assetDoc = ref<MediaAsset | null>(null)

const refValue = computed(() => props.modelValue?.asset?._ref)

const displayUrl = computed(() => assetDoc.value?.url || refValue.value || '')
const displayName = computed(() => assetDoc.value?.originalFilename || assetDoc.value?._filename || refValue.value || '')

async function resolveAsset() {
  const ref = refValue.value
  assetDoc.value = null
  if (!ref) return
  if (ref.startsWith('http')) {
    assetDoc.value = {
      _id: '',
      _type: props.type === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
      url: ref,
      originalFilename: ref.split('/').pop()
    }
    return
  }
  try {
    const doc = await $fetch<MediaAsset>(`/api/media/${ref}?dataset=${encodeURIComponent(props.dataset || 'production')}`)
    assetDoc.value = doc
  } catch {
    assetDoc.value = null
  }
}

watch(refValue, () => resolveAsset(), { immediate: true })

function setAsset(ref: string) {
  emit('update:modelValue', { _type: props.type, asset: { _ref: ref } })
}

function clearAsset() {
  emit('update:modelValue', { _type: props.type })
}

function openFilePicker() {
  fileInput.value?.click()
}

function getExtension(filename: string) {
  return filename.split('.').pop() || ''
}

function getMimeType(filename: string) {
  const ext = getExtension(filename).toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml'
  }
  return map[ext] || 'application/octet-stream'
}

function formatBytes(bytes?: number) {
  if (bytes == null) return ''
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'kB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

async function createAssetDocument(file: File, url: string) {
  const body = {
    _type: props.type === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
    url,
    originalFilename: file.name,
    mimeType: file.type || getMimeType(file.name),
    extension: getExtension(file.name),
    size: file.size
  }
  const result = await $fetch<{ _id: string }>(`/api/documents?dataset=${encodeURIComponent(props.dataset || 'production')}`, {
    method: 'POST',
    body
  })
  return result._id
}

async function processFile(file: File) {
  if (props.readonly) return
  if (props.type === 'image' && !file.type.startsWith('image/')) {
    toast.add({ title: 'Please select an image file', color: 'error' })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const uploadResult = await $fetch<{ files: Array<{ url: string }> }>('/api/upload', {
      method: 'POST',
      body: formData
    })

    const uploadedUrl = uploadResult.files[0]?.url
    if (!uploadedUrl) {
      toast.add({ title: 'Upload failed', color: 'error' })
      return
    }

    const assetId = await createAssetDocument(file, uploadedUrl)
    setAsset(assetId)
    toast.add({ title: 'Uploaded', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Upload failed', description: (e as Error).message, color: 'error' })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await processFile(file)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (props.readonly) return
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  processFile(file)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (props.readonly) return
  dragging.value = true
}

function onDragLeave() {
  if (props.readonly) return
  dragging.value = false
}

function onSelect(asset: MediaAsset) {
  if (asset._id) {
    setAsset(asset._id)
  } else if (asset.url) {
    setAsset(asset.url)
  }
}

function downloadAsset() {
  if (!displayUrl.value) return
  const a = document.createElement('a')
  a.href = displayUrl.value
  a.download = displayName.value || 'download'
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}

function copyUrl() {
  if (!displayUrl.value) return
  navigator.clipboard.writeText(displayUrl.value)
  toast.add({ title: 'URL copied', color: 'success' })
}

const actionItems = computed(() => {
  const items = [
    [{
      label: 'Download',
      icon: 'i-lucide-download',
      onSelect: downloadAsset
    }, {
      label: 'Copy URL',
      icon: 'i-lucide-link',
      onSelect: copyUrl
    }]
  ]
  if (!props.readonly) {
    items.unshift([{
      label: 'Upload',
      icon: 'i-lucide-upload',
      onSelect: openFilePicker
    }, {
      label: 'Media',
      icon: 'i-lucide-image',
      onSelect: () => selectOpen.value = true
    }])
    items.push([{
      label: 'Clear field',
      icon: 'i-lucide-x',
      onSelect: clearAsset
    }])
  }
  return items
})
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="!displayUrl"
      class="border border-dashed border-default rounded-lg p-6 text-center transition"
      :class="dragging ? 'bg-primary/5 border-primary' : 'bg-elevated/25 hover:bg-elevated/50'"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <UIcon
        name="i-lucide-image"
        class="size-8 mx-auto text-muted mb-2"
      />
      <div class="text-sm text-muted mb-3">
        {{ readonly ? 'No asset selected' : `Drag or paste ${type === 'image' ? 'image' : 'file'} here` }}
      </div>
      <div
        v-if="!readonly"
        class="flex items-center justify-center gap-2"
      >
        <UButton
          label="Upload"
          icon="i-lucide-upload"
          size="sm"
          variant="outline"
          color="neutral"
          :loading="uploading"
          @click="openFilePicker"
        />
        <UButton
          label="Select"
          icon="i-lucide-search"
          size="sm"
          variant="outline"
          color="neutral"
          @click="selectOpen = true"
        />
      </div>
    </div>

    <div
      v-else
      class="rounded-lg border border-default bg-elevated/25 overflow-hidden"
    >
      <div class="relative group">
        <img
          v-if="type === 'image'"
          :src="displayUrl"
          class="w-full max-h-64 object-contain"
          :alt="displayName"
        >
        <div
          v-else
          class="flex items-center gap-3 p-4"
        >
          <UIcon
            name="i-lucide-file"
            class="size-10 text-muted"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium truncate">
              {{ displayName }}
            </div>
            <div class="text-xs text-muted truncate">
              {{ displayUrl }}
            </div>
          </div>
        </div>

        <div
          v-if="!readonly"
          class="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition"
        >
          <UDropdownMenu
            :items="actionItems"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-more-vertical"
              size="sm"
              color="neutral"
              variant="solid"
            />
          </UDropdownMenu>
        </div>
      </div>

      <div class="p-2 text-xs text-muted flex items-center justify-between">
        <span class="truncate">{{ displayName }}</span>
        <span v-if="assetDoc?.size">{{ formatBytes(assetDoc.size) }}</span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="type === 'image' ? 'image/*' : undefined"
      @change="onFileChange"
    >

    <MediaSelectModal
      v-model:open="selectOpen"
      :type="type"
      @select="onSelect"
    />
  </div>
</template>
