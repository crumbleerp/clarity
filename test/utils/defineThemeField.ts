import { defineField } from 'sanity'
import config from '../../global.config'

const themes = config.globals.themes

export const defineThemeField = (schemaField: { name: string, title: string, type: string }) => defineField({
  name: schemaField.name,
  title: schemaField.title,
  type: 'object',
  fields: themes.map(theme => defineField({ name: theme, title: theme, type: schemaField.type }))
})
