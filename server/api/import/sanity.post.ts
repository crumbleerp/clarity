import { createJob } from '../../services/jobs'
import { runImportJob, type ImportConfig } from '../../services/import-worker'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody(event)
  const { projectId, dataset, token, apiVersion = 'v2026-06-26', targetDataset = 'production' } = body

  if (!projectId || !dataset || !token) {
    throw createError({ statusCode: 400, message: 'projectId, dataset and token are required' })
  }

  const config: ImportConfig = { projectId, dataset, token, apiVersion, targetDataset }
  const jobId = await createJob(config as unknown as Record<string, string>)

  // Start background job without awaiting
  runImportJob(jobId, config).catch((e: unknown) => {
    console.error('[import-worker] failed:', e)
  })

  return { jobId }
})
