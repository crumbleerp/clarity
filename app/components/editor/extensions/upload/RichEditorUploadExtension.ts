import { Node, mergeAttributes } from '@tiptap/core'
import type { CommandProps } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import RichEditorUploadExtensionNode from './RichEditorUploadExtensionNode.vue'
import type { Editor } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        imageUpload: {
            insertImageUpload: () => ReturnType
        }
    }
}

export const ImageUpload = Node.create({
    name: 'imageUpload',
    group: 'block',
    atom: true,
    inline: false,
    selectable: true,
    draggable: true,
    addAttributes: () => ({}),
    parseHTML: () => [{ tag: 'div[data-type="image-upload"]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })],
    addNodeView: () => VueNodeViewRenderer(RichEditorUploadExtensionNode),
    addCommands() { return {
        insertImageUpload: () => ({ commands }: CommandProps) => commands.insertContent({ type: this.name })
    }}
})

export const ImageUploadHandlers = { imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined
}}
