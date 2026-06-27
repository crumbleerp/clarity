import { defineField, defineType } from '../../dist'

export default defineType({
  name: 'skill',
  title: 'Skill',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string'
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string'
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string'
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number'
    })
  ]
})
