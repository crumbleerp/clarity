<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const toast = useToast()
const currentDataset = useCurrentDataset()
const uploading = ref(false)

function getExtension(filename: string) {
  return filename.split('.').pop() || ''
}

async function createAssetDocument(file: File, url: string) {
  const result = await $fetch('/api/documents', {
    method: 'POST',
    body: {
      _type: 'sanity.imageAsset',
      url,
      originalFilename: file.name,
      mimeType: file.type,
      extension: getExtension(file.name),
      size: file.size
    }
  }) as { _id: string }
  return result._id
}

async function uploadAndInsert(file: File | null | undefined) {
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const endpoint = '/api/upload' as string
    const uploadResult = await $fetch(endpoint, {
      method: 'POST',
      body: formData
    }) as { files: Array<{ url: string }> }

    const url = uploadResult.files[0]?.url
    if (!url) {
      toast.add({ title: 'Upload failed', color: 'error' })
      return
    }

    await createAssetDocument(file, url)

    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).setImage({ src: url }).run()
  } catch (e: unknown) {
    toast.add({ title: 'Image upload failed', description: (e as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) uploadAndInsert(file)
}
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      class="h-full w-full"
      size="xl"
      variant="area"
      :preview="false"
      accept=".svg,.png,.jpg,.jpeg,.gif,.webp"
      icon="i-lucide-image"
      :ui="{
        label: 'text-highlighted! text-pretty! font-bold! text-base! text-3xl!',
        description: 'text-balance! text-center! text-sm! text-muted!'
      }"
      @change="onChange"
    />
  </NodeViewWrapper>
</template>
