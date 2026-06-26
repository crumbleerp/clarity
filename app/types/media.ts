export interface MediaAsset {
  _id: string
  _type: 'sanity.imageAsset' | 'sanity.fileAsset'
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  _originalId?: string
  _filename?: string
  _resolution?: string
  _references?: number
  _sizeLabel?: string
  originalFilename?: string
  title?: string
  altText?: string
  description?: string
  tags?: string[]
  url?: string
  mimeType?: string
  extension?: string
  size?: number
  metadata?: {
    dimensions?: { width?: number, height?: number }
  }
}

export interface MediaListResponse {
  assets: MediaAsset[]
  total: number
  limit: number
  offset: number
}
