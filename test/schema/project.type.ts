import { defineField, defineType } from 'sanity'
import { defineI18nField } from '../utils/defineI18nField'
import { defineThemeField } from '../utils/defineThemeField'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string'
    }),
    defineI18nField({
      name: 'name',
      title: 'Project name',
      type: 'string'
    }),
    defineThemeField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image'
    }),
    defineThemeField({
      name: 'logo',
      title: 'Project logo',
      type: 'image'
    }),
    defineI18nField({
      name: 'description',
      title: 'Small project description',
      type: 'markdown'
    }),
    defineField({
      name: 'images',
      title: 'Screenshots / images',
      type: 'array',
      of: [{ type: 'image' }]
    }),
    defineField({
      name: 'bg',
      title: 'Background color for images carousel',
      type: 'color'
    }),
    defineI18nField({
      name: 'about',
      title: 'About project',
      type: 'markdown'
    }),
    defineField({
      name: 'related',
      title: 'Related projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }]
    }),
    defineI18nField({
      name: 'status',
      title: 'Project status',
      type: 'string'
    }),
    defineField({
      name: 'links',
      title: 'Project links',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'repo',
      title: 'Github repo (ex: xlsft/photon)',
      type: 'string'
    }),
    defineField({
      name: 'tags',
      title: 'Project tags (oss, featured, etc.)',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'stack',
      title: 'Stack used',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'skill' }] }]
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number'
    }),
    defineI18nField({
      name: 'copyright',
      title: 'Project copyright (logo, name etc.)',
      type: 'text'
    })
  ]
})
