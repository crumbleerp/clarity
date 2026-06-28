import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const url = event ? getRequestURL(event).pathname : 'unknown'
    logger.error({ err: error, url }, 'Request error')
  })
})
