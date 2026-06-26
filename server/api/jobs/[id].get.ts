import { getJob } from '../../services/jobs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Job ID required' })
  }

  const job = await getJob(id)
  if (!job) {
    throw createError({ statusCode: 404, message: 'Job not found' })
  }

  return {
    id: job.id,
    type: job.type,
    status: job.status,
    result: job.result ? JSON.parse(job.result) : null,
    error: job.error,
    logs: JSON.parse(job.logs || '[]'),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  }
})
