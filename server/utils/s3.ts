import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export interface S3Config {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
}

export function getS3Config(): S3Config {
  const config = useRuntimeConfig()
  return {
    endpoint: config.s3Endpoint || '',
    region: config.s3Region || 'us-east-1',
    bucket: config.s3Bucket || '',
    accessKeyId: config.s3AccessKey || '',
    secretAccessKey: config.s3SecretKey || '',
    publicUrl: config.s3PublicUrl || ''
  }
}

let _client: S3Client | null = null

export function useS3(): S3Client {
  if (!_client) {
    const config = getS3Config()
    _client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      forcePathStyle: true
    })
  }
  return _client
}

export function getPublicUrl(key: string) {
  const { publicUrl, endpoint, bucket } = getS3Config()
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${key}`
  }
  return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`
}

export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = useS3()
  const { bucket } = getS3Config()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  }))

  return getPublicUrl(key)
}
