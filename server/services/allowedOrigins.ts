import { useDb } from '../db'
import { allowedOrigins } from '../db/schema/allowedOrigins'

let cache: Set<string> | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000

export function invalidateAllowedOriginsCache() {
  cache = null
  cacheTimestamp = 0
}

export async function getAllowedOrigins(): Promise<Set<string>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache
  }

  const config = useRuntimeConfig()
  const envOrigins = String(config.corsOrigins || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  const db = useDb()
  const rows = await db.select({ origin: allowedOrigins.origin }).from(allowedOrigins)
  const origins = new Set([...envOrigins, ...rows.map(r => r.origin)])

  cache = origins
  cacheTimestamp = Date.now()
  return origins
}
