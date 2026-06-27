import { defineField, defineType } from '../../dist'
import { defineI18nField } from '../utils/defineI18nField'

export default defineType({
  name: 'education',
  title: 'Education',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string'
    }),
    defineI18nField({
      name: 'level',
      title: 'Level of education',
      type: 'string'
    }),
    defineI18nField({
      name: 'name',
      title: 'Organization name',
      type: 'string'
    }),
    defineField({
      name: 'link',
      title: 'Link to organization site',
      type: 'string'
    }),
    defineI18nField({
      name: 'faculty',
      title: 'Faculty name',
      type: 'string'
    }),
    defineI18nField({
      name: 'specialization',
      title: 'Specialization name',
      type: 'string'
    }),
    defineField({
      name: 'year',
      title: 'Graduation year (expected)',
      type: 'number'
    })
  ]
})
