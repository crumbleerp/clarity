import { createJob } from '../../services/jobs'
import { runImportJob, type ImportConfig } from '../../services/import-worker'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)

  const body = await readBody(event)
  const { projectId, dataset, token, apiVersion = 'v2026-06-26', targetDataset = 'production' } = body

  if (!projectId || !dataset || !token) {
    throw createError({ statusCode: 400, message: 'projectId, dataset and token are required' })
  }

  const config: ImportConfig = { projectId, dataset, token, apiVersion, targetDataset }
  const jobId = await createJob(config as unknown as Record<string, string>)

  runImportJob(jobId, config).catch((e: unknown) => {
    logger.error({ err: e, jobId }, 'Import job failed')
  })

  return { jobId }
})
