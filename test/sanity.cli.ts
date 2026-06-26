import { defineCliConfig } from 'sanity/cli'
import config from '../global.config'

export default defineCliConfig({
  api: {
    projectId: config.cms.project,
    dataset: config.cms.dataset
  },
  deployment: {
    autoUpdates: true,
    appId: process.env.SANITY_APP
  }
})
