import { uploadToS3 } from '../utils/s3'
import { requireModeratorOrAbove } from '../utils/auth'
import { useDb } from '../db'
import { documents } from '../db/schema/documents'
import { invalidateCache } from '../services/cache'
import { imageSize } from 'image-size'

export default defineEventHandler(async (event) => {
  requireModeratorOrAbove(event)

  const query = getQuery(event)
  const dataset = (query.dataset as string) || 'production'
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No files uploaded' })
  }

  const results: Array<{
    originalName: string
    key: string
    url: string
    contentType: string
    assetId: string
    type: 'sanity.imageAsset' | 'sanity.fileAsset'
  }> = []

  const db = useDb()

  for (const part of formData) {
    if (!part.filename || !part.data) continue

    const ext = part.filename.split('.').pop() || ''
    const assetId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const key = `assets/${assetId}.${ext}`
    const contentType = part.type || 'application/octet-stream'
    const isImage = contentType.startsWith('image/')
    const type: 'sanity.imageAsset' | 'sanity.fileAsset' = isImage ? 'sanity.imageAsset' : 'sanity.fileAsset'

    const url = await uploadToS3(key, part.data, contentType)

    const data: Record<string, unknown> = {
      _id: assetId,
      _type: type,
      assetId,
      extension: ext,
      mimeType: contentType,
      originalFilename: part.filename,
      path: key,
      url,
      size: part.data.length,
      uploadId: crypto.randomUUID()
    }

    if (isImage) {
      try {
        const dims = imageSize(part.data)
        if (dims.width && dims.height) {
          data.metadata = {
            dimensions: { width: dims.width, height: dims.height, aspectRatio: dims.width / dims.height },
            hasAlpha: dims.type === 'png' || dims.type === 'webp'
          }
        }
      } catch {
        // ignore unsupported image format
      }
    }

    const now = new Date()

    await db.insert(documents).values({
      id: assetId,
      dataset,
      type,
      rev: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      data
    })

    results.push({
      originalName: part.filename,
      key,
      url,
      contentType,
      assetId,
      type
    })
  }

  if (results.length > 0) {
    invalidateCache(dataset)
  }

  return {
    files: results
  }
})
