import { defineField, defineType } from '../../dist'
import { defineI18nField } from '../utils/defineI18nField'

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string'
    }),
    defineI18nField({
      name: 'label',
      title: 'Label',
      type: 'string'
    }),
    defineI18nField({
      name: 'short',
      title: 'Short label',
      type: 'string'
    }),
    defineField({
      name: 'to',
      title: 'To',
      type: 'string'
    })
  ]
})
