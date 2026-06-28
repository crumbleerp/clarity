import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function getWindow(windowMs: number) {
  return Math.ceil(Date.now() / windowMs) * windowMs
}

function getKey(event: H3Event, prefix: string): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || event.node.req.socket.remoteAddress || 'unknown'
  return `${prefix}:${ip}`
}

export function rateLimit(event: H3Event, options: { max: number, windowMs: number, prefix?: string }) {
  const key = getKey(event, options.prefix || 'default')
  const windowStart = getWindow(options.windowMs)
  const existing = store.get(key)

  if (!existing || existing.resetAt < Date.now()) {
    store.set(key, { count: 1, resetAt: windowStart + options.windowMs })
    return { allowed: true, remaining: options.max - 1 }
  }

  if (existing.count >= options.max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((existing.resetAt - Date.now()) / 1000) }
  }

  existing.count += 1
  return { allowed: true, remaining: options.max - existing.count }
}
