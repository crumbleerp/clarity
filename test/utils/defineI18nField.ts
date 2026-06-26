import { defineField } from 'sanity'
import config from '../../global.config'

const locales = config.globals.locales

export const defineI18nField = (schemaField: { name: string, title: string, type: string }) => defineField({
  name: schemaField.name,
  title: schemaField.title,
  type: 'object',
  fields: locales.map(locale => defineField({ name: locale, title: locale.toUpperCase(), type: schemaField.type }))
})
