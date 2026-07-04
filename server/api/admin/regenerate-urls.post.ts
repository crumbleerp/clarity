import { createJob } from '../../services/jobs'
import { runRegenerateUrlsJob } from '../../services/regenerate-urls-worker'
import { requireAdminOrRoot } from '../../utils/auth'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  requireAdminOrRoot(event)

  const dataset = getQuery(event).dataset as string || 'production'
  const jobId = await createJob('regenerate-urls', { dataset })

  runRegenerateUrlsJob(jobId, { dataset }).catch((e: unknown) => {
    logger.error({ err: e, jobId }, 'Regenerate URLs job failed')
  })

  return { jobId }
})
