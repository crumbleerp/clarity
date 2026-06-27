import { defineField, defineType } from '../../dist'
import { defineI18nField } from '../utils/defineI18nField'

export default defineType({
  name: 'summary',
  title: 'Summary',
  type: 'document',
  fields: [
    defineI18nField({
      name: 'content',
      title: 'Content',
      type: 'markdown'
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image'
    }),
    defineI18nField({
      name: 'status',
      title: 'Status',
      type: 'string'
    }),
    defineI18nField({
      name: 'title',
      title: 'Title',
      type: 'string'
    }),
    defineI18nField({
      name: 'description',
      title: 'Description',
      type: 'string'
    }),
    defineI18nField({
      name: 'legal',
      title: 'Legal',
      type: 'markdown'
    })
  ]
})
