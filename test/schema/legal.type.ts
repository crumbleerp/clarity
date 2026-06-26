import { defineField, defineType } from 'sanity'
import { defineI18nField } from '../utils/defineI18nField'

export default defineType({
  name: 'legal',
  title: 'Legal',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string'
    }),
    defineI18nField({
      name: 'title',
      title: 'Title',
      type: 'string'
    }),
    defineI18nField({
      name: 'description',
      title: 'Small description',
      type: 'markdown'
    }),
    defineI18nField({
      name: 'content',
      title: 'Document content',
      type: 'markdown'
    })
  ]
})
