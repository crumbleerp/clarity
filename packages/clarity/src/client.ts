export interface Config {
  endpoint?: string
  dataset?: string
  version?: string
  token?: string
  fetch?: typeof globalThis.fetch
}

export interface Options {
  tag?: string
  signal?: AbortSignal
}

export class Client {
  config: Required<Pick<Config, 'version'>> & Config

  constructor(config: Config = {}) {
    this.config = {
      version: '1',
      endpoint: '',
      ...config
    }
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
