import { parse, evaluate } from 'groq-js'

export class GroqQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroqQueryError'
  }
}

export function validateQueryParameters(
  queryString: string,
  params: Record<string, unknown> = {}
) {
  let tree
  try {
    tree = parse(queryString)
  } catch {
    return
  }

  const missing: string[] = []
  const seen = new Set<string>()

  function visit(node: unknown) {
    if (!node || typeof node !== 'object') {
      return
    }
    const n = node as Record<string, unknown>
    if (n.type === 'Parameter') {
      const name = String(n.name)
      if (!Object.prototype.hasOwnProperty.call(params, name) && !seen.has(name)) {
        missing.push(name)
        seen.add(name)
      }
      return
    }
    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        value.forEach(visit)
      } else if (value && typeof value === 'object') {
        visit(value)
      }
    }
  }

  visit(tree)

  if (missing.length) {
    const names = missing.map(n => `$${n}`).join(', ')
    const verb = missing.length === 1 ? 'is' : 'are'
    throw new GroqQueryError(`Query parameter${missing.length === 1 ? '' : 's'} ${names} ${verb} not defined`)
  }
}

export async function executeQuery(
  queryString: string,
  dataset: Record<string, unknown>[],
  params: Record<string, unknown> = {}
) {
  validateQueryParameters(queryString, params)

  let tree
  try {
    tree = parse(queryString)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new GroqQueryError(message)
  }

  try {
    const value = await evaluate(tree, { dataset, params })
    return await value.get()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new GroqQueryError(message)
  }
}
