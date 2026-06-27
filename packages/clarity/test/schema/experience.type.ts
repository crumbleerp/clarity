import { defineField, defineType } from '../../dist'
import { defineI18nField } from '../utils/defineI18nField'
import { defineThemeField } from '../utils/defineThemeField'

export default defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string'
    }),
    defineI18nField({
      name: 'name',
      title: 'Company name',
      type: 'string'
    }),
    defineThemeField({
      name: 'logo',
      title: 'Logo',
      type: 'image'
    }),
    defineI18nField({
      name: 'about',
      title: 'About company',
      type: 'markdown'
    }),
    defineI18nField({
      name: 'aboutShort',
      title: 'Short about company',
      type: 'markdown'
    }),
    defineField({
      name: 'link',
      title: 'Company link',
      type: 'string'
    }),
    defineField({
      name: 'positions',
      title: 'Positions in company',
      type: 'array',
      of: [
        defineField({
          name: 'position',
          title: 'Position',
          type: 'document',
          fields: [
            defineI18nField({
              name: 'name',
              title: 'Position name',
              type: 'string'
            }),
            defineField({
              name: 'skills',
              title: 'Skills used',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'skill' }] }]
            }),
            defineI18nField({
              name: 'description',
              title: 'Job description',
              type: 'markdown'
            }),
            defineI18nField({
              name: 'descriptionShort',
              title: 'Short job description',
              type: 'markdown'
            }),
            defineField({
              name: 'duration',
              title: 'Duration',
              type: 'object',
              fields: [
                defineField({
                  name: 'from',
                  title: 'From date',
                  type: 'date'
                }),
                defineField({
                  name: 'to',
                  title: 'To date',
                  type: 'date'
                })
              ]
            })
          ]
        })
      ]
    }),
    defineI18nField({
      name: 'footer',
      title: 'Footer / aftermath',
      type: 'markdown'
    })
  ]
})
