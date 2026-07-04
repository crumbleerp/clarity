import type { Type } from './schema.js'

export interface Config {
  endpoint?: string
  dataset?: string
  version?: string
  token?: string
  schema?: Type | Type[]
  fetch?: typeof globalThis.fetch
}

export interface Options {
  tag?: string
  signal?: AbortSignal
}

export class Client {
  config: Required<Pick<Config, 'version'>> & Config
  schema: Type[]

  constructor(config: Config = {}) {
    this.config = {
      version: '1',
      endpoint: '',
      ...config
    }
    this.schema = Array.isArray(config.schema)
      ? config.schema
      : config.schema
        ? [config.schema]
        : []
  }

  fetch<R = unknown>(query: string, params: Record<string, unknown> = {}, options: Options = {}): Promise<R> {
    const url = new URL(this.getQueryUrl())
    url.searchParams.set('query', query)
    if (Object.keys(params).length) {
      url.searchParams.set('params', JSON.stringify(params))
    }

    const headers: Record<string, string> = {
      Accept: 'application/json'
    }
    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`
    }

    const fetchFn = this.config.fetch || globalThis.fetch

    return fetchFn(url.toString(), {
      method: 'GET',
      headers,
      signal: options.signal
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Clarity fetch error ${res.status}: ${text}`)
      }
      const json = await res.json() as { result?: R }
      return json.result as R
    })
  }

  syncSchema(): Promise<unknown> {
    const { endpoint, dataset } = this.config
    const datasetName = dataset || 'production'
    if (!endpoint) throw new Error('No Clarity endpoint provided')
    if (!this.schema.length) throw new Error('No schema provided')

    const url = new URL(`${endpoint.replace(/\/$/, '')}/api/schemas`)
    url.searchParams.set('dataset', datasetName)

    const headers = this.buildHeaders()
    headers['Content-Type'] = 'application/json'

    const fetchFn = this.config.fetch || globalThis.fetch

    return fetchFn(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(this.schema)
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Clarity syncSchema error ${res.status}: ${text}`)
      }
      return res.json() as unknown
    })
  }

  fetchSchemas(): Promise<Type[]> {
    const { endpoint, dataset } = this.config
    const datasetName = dataset || 'production'
    if (!endpoint) throw new Error('No Clarity endpoint provided')
    if (!this.config.token) throw new Error('No Clarity token provided')

    const url = new URL(`${endpoint.replace(/\/$/, '')}/api/schemas`)
    url.searchParams.set('dataset', datasetName)

    const fetchFn = this.config.fetch || globalThis.fetch

    return fetchFn(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders()
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Clarity fetchSchemas error ${res.status}: ${text}`)
      }
      const json = await res.json() as Array<{ name: string, title: string, schema_type: string, fields: unknown[] }>
      return json.map(item => ({
        name: item.name,
        title: item.title,
        type: item.schema_type as 'document' | 'object',
        fields: item.fields
      })) as Type[]
    })
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json'
    }
    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`
    }
    return headers
  }

  private getQueryUrl(): string {
    const { endpoint, dataset, version } = this.config
    const datasetName = dataset || 'production'
    if (!endpoint) throw new Error('No Clarity endpoint provided')
    return `${endpoint.replace(/\/$/, '')}/v${version}/data/query/${datasetName}`
  }
}

export function createClient(config: Config): Client {
  return new Client(config)
}
