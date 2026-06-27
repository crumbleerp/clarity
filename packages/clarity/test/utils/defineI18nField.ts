import { defineField, type Field } from '../../dist'

const locales = ['ru', 'en']

export const defineI18nField = (field: Field) => defineField({
  name: field.name,
  title: field.title,
  type: 'object',
  fields: locales.map(locale => defineField({ name: locale, title: locale.toUpperCase(), type: field.type }))
})
