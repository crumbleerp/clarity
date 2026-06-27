<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  lite?: boolean
  placeholder?: string
  class?: HTMLAttributes['class']
  type: 'html' | 'markdown'
}>()

const model = defineModel<string | null | undefined>({ required: true, default: null })

const t = (s: string) => s

const history = computed(() => [
  { kind: 'undo', icon: 'i-lucide-undo', label: t('undo'), tooltip: { text: t('undo') } },
  { kind: 'redo', icon: 'i-lucide-redo', label: t('redo'), tooltip: { text: t('redo') } }
])
const marks = computed(() => [
  { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', label: t('bold'), tooltip: { text: t('bold') } },
  { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', label: t('italic'), tooltip: { text: t('italic') } },
  { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', label: t('underline'), tooltip: { text: t('underline') } },
  { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', label: t('strikethrough'), tooltip: { text: t('strikethrough') } },
  { kind: 'mark', mark: 'code', icon: 'i-lucide-code', label: t('code'), tooltip: { text: t('code') } }
])
const styles = computed(() => [
  { kind: 'paragraph', icon: 'i-lucide-pilcrow', label: t('text'), tooltip: { text: t('text') } },
  { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: t('heading1'), tooltip: { text: t('heading1') } },
  { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: t('heading2'), tooltip: { text: t('heading2') } },
  { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: t('heading3'), tooltip: { text: t('heading3') } }
])
const lists = computed(() => [
  { kind: 'bulletList', label: t('bullet list'), icon: 'i-lucide-list', tooltip: { text: t('bullet list') } },
  { kind: 'orderedList', label: t('ordered list'), icon: 'i-lucide-list-ordered', tooltip: { text: t('ordered list') } }
])
const inserts = computed(() => [
  { kind: 'blockquote', label: t('blockquote'), icon: 'i-lucide-quote', tooltip: { text: t('blockquote') } },
  { kind: 'codeBlock', label: t('codeblock'), icon: 'i-lucide-terminal', tooltip: { text: t('codeblock') } },
  { kind: 'horizontalRule', label: t('divider'), icon: 'i-lucide-minus', tooltip: { text: t('divider') } },
])

const bubble = computed(() => props.lite
  ? [marks.value]
  : [styles.value, marks.value].map(group => group.map(item => ({ ...item, label: undefined, size: 'sm' as const }))))

const toolbar = computed(() => [
  history.value,
  styles.value,
  marks.value,
  inserts.value
].map(group => group.map(item => ({ ...item, label: undefined, size: 'sm' as const }))))

const commands = computed(() => [[
  { type: 'label', label: t('text') },
  ...styles.value,
  { type: 'label', label: t('lists') },
  ...lists.value,
  { type: 'label', label: t('insert') },
  ...inserts.value
]])
</script>

<template>
  <div class="w-full h-full" :class="props.class">
    <UEditor
      v-model="model"
      :content-type="props.type"
      :placeholder="props.placeholder || t('placeholder')"
      :ui="{
        root: 'pt-16 h-full',
        content: 'overflow-y-scroll scrollbar'
      }"
      class="w-full relative"
    >
      <template #default="{ editor }">
        <UEditorToolbar
          v-if="!props.lite"
          :editor="editor"
          :items="toolbar as any"
          layout="fixed"
          class="mb-4 border-b bg-default/75 backdrop-blur absolute top-0 left-0 w-full z-10"
          :ui="{ group: 'gap-2 p-2', base: 'gap-0' }"
        />
        <UEditorToolbar
          :editor="editor"
          :items="bubble as any"
          layout="bubble"
          :ui="{ group: 'gap-2 p-2', base: 'gap-0 p-0' }"
        />
      </template>
    </UEditor>
  </div>
</template>
