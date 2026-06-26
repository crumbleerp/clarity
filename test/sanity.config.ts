import { defineConfig } from 'sanity'
import schema from './schema'
import plugins from './sanity.plugins'
import config from '../global.config'

export default defineConfig({
  name: 'default',
  title: 'cms',

  projectId: config.cms.project,
  dataset: config.cms.dataset,
  basePath: '/admin',
  plugins,
  schema: {
    types: schema
  }
})
