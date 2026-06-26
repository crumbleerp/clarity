import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { colorInput } from '@sanity/color-input'
import { media } from 'sanity-plugin-media'
import { codeInput } from '@sanity/code-input'
import { markdownSchema } from 'sanity-plugin-markdown'

export default [
  structureTool(),
  visionTool(),
  colorInput(),
  media(),
  codeInput(),
  markdownSchema()
]
