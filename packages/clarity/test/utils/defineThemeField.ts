import { defineField, type Field } from '../../dist'

const themes = ['dark', 'light']

export const defineThemeField = (field: Field) => defineField({
  name: field.name,
  title: field.title,
  type: 'object',
  fields: themes.map(theme => defineField({ name: theme, title: theme, type: field.type }))
})
