<script setup lang="ts">
import type { MediaAsset } from '~/types/media'

const props = defineProps<{
  asset?: MediaAsset | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [payload: Partial<MediaAsset>]
  'delete': []
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isImage = computed(() => props.asset?._type === 'sanity.imageAsset' || (props.asset?.mimeType ?? '').startsWith('image/'))

const filename = ref('')
const title = ref('')
const altText = ref('')
const description = ref('')
const tags = ref('')

watch(() => props.asset, (asset) => {
  filename.value = asset?.originalFilename || ''
  title.value = asset?.title || ''
  altText.value = asset?.altText || ''
  description.value = asset?.description || ''
  tags.value = Array.isArray(asset?.tags) ? asset.tags.join(', ') : ''
}, { immediate: true })

const sizeLabel = computed(() => {
  const bytes = props.asset?.size
  if (bytes == null) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'kB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number((bytes / k ** i).toFixed(1))} ${sizes[i]}`
})

function copyUrl() {
  if (!props.asset?.url) return
  navigator.clipboard.writeText(props.asset.url)
  toast.add({ title: 'URL copied', color: 'success' })
}

function downloadAsset() {
  if (!props.asset?.url) return
  const a = document.createElement('a')
  a.href = props.asset.url
  a.download = props.asset.originalFilename || `download.${props.asset.extension || 'bin'}`
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}

function onSave() {
  emit('save', {
    originalFilename: filename.value,
    title: title.value,
    altText: altText.value,
    description: description.value,
    tags: tags.value.split(',').map(t => t.trim()).filter(Boolean)
  })
}

function onDelete() {
  emit('delete')
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-5xl rounded-lg shadow-lg ring ring-default'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold">
          Asset details
        </h2>
      </div>
    </template>

    <template #body>
      <div
        v-if="!asset"
        class="text-muted text-center py-12"
      >
        No asset selected
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <!-- Preview -->
        <div class="flex flex-col gap-4">
          <div class="aspect-square rounded-lg border border-default bg-elevated/50 flex items-center justify-center overflow-hidden">
            <img
              v-if="isImage && asset.url"
              :src="asset.url"
              class="max-w-full max-h-full object-contain"
              :alt="altText || filename"
            >
            <UIcon
              v-else
              name="i-lucide-file"
              class="size-24 text-muted"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-muted">
                Size
              </div>
              <div>{{ sizeLabel }}</div>
            </div>
            <div>
              <div class="text-muted">
                MIME type
              </div>
              <div class="truncate">
                {{ asset.mimeType || '-' }}
              </div>
            </div>
            <div>
              <div class="text-muted">
                Extension
              </div>
              <div>{{ asset.extension?.toUpperCase() || '-' }}</div>
            </div>
            <div v-if="asset.metadata?.dimensions?.width">
              <div class="text-muted">
                Dimensions
              </div>
              <div>{{ asset.metadata.dimensions.width }}×{{ asset.metadata.dimensions.height }}px</div>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              icon="i-lucide-download"
              label="Download"
              color="neutral"
              variant="outline"
              block
              @click="downloadAsset"
            />
            <UButton
              icon="i-lucide-link"
              label="Copy URL"
              color="neutral"
              variant="outline"
              block
              @click="copyUrl"
            />
          </div>
        </div>

        <!-- Details form -->
        <div class="space-y-4">
          <UFormField label="Tags">
            <UInput
              v-model="tags"
              placeholder="Enter tags separated by commas"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Filename">
            <UInput
              v-model="filename"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Title">
            <UInput
              v-model="title"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Alt Text">
            <UInput
              v-model="altText"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="description"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            label="Delete"
            @click="onDelete"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="isOpen = false"
        />
        <UButton
          label="Save and close"
          icon="i-lucide-save"
          @click="onSave"
        />
      </div>
    </template>
  </UModal>
</template>
