<script setup lang="ts">
const props = defineProps<{
  dataset: string
}>()

const emit = defineEmits<{
  uploaded: []
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const totalFiles = ref(0)
const uploadedFiles = ref(0)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
}

function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

async function uploadFiles(files: File[]) {
  if (uploading.value) return

  const validFiles = files.filter(f => f.size > 0)
  if (validFiles.length === 0) return

  uploading.value = true
  totalFiles.value = validFiles.length
  uploadedFiles.value = 0
  progress.value = 0

  const formData = new FormData()
  for (const file of validFiles) {
    formData.append('files', file)
  }

  try {
    const xhr = new XMLHttpRequest()

    await new Promise<void>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          progress.value = Math.round((event.loaded / event.total) * 100)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.open('POST', `/api/upload?dataset=${encodeURIComponent(props.dataset)}`)
      xhr.send(formData)
    })

    toast.add({ title: 'Upload complete', description: `${validFiles.length} file(s) uploaded`, color: 'success' })
    emit('uploaded')
  } catch (e: unknown) {
    toast.add({ title: 'Upload failed', description: (e as Error).message, color: 'error' })
  } finally {
    uploading.value = false
    progress.value = 0
    totalFiles.value = 0
    uploadedFiles.value = 0
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>

<template>
  <div
    class="relative rounded-lg border-2 border-dashed transition-colors p-6 text-center cursor-pointer"
    :class="[
      isDragging ? 'border-primary bg-primary/5' : 'border-default bg-default/30 hover:bg-default/50',
      uploading && 'pointer-events-none opacity-70'
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="openFilePicker"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="handleFileSelect"
    >

    <UIcon
      name="i-lucide-upload-cloud"
      class="size-10 mx-auto text-muted mb-3"
    />

    <p class="text-sm font-medium">
      Drop files here or click to upload
    </p>
    <p class="text-xs text-muted mt-1">
      Supports multiple images and files
    </p>

    <div
      v-if="uploading"
      class="mt-4"
    >
      <div class="h-2 rounded-full bg-default overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-150"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <p class="text-xs text-muted mt-2">
        Uploading... {{ progress }}%
      </p>
    </div>
  </div>
</template>
