import { uploadToS3 } from '../utils/s3'

export default defineEventHandler(async (event) => {
  requireUser(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No files uploaded' })
  }

  const results: Array<{ originalName: string, key: string, url: string, contentType: string }> = []

  for (const part of formData) {
    if (!part.filename || !part.data) continue

    const ext = part.filename.split('.').pop() || ''
    const baseName = part.filename.replace(/\.[^.]+$/, '')
    const safeName = baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const key = `${Date.now()}-${safeName}.${ext}`

    const url = await uploadToS3(key, part.data, part.type || 'application/octet-stream')
    results.push({
      originalName: part.filename,
      key,
      url,
      contentType: part.type || 'application/octet-stream'
    })
  }

  return {
    files: results
  }
})
