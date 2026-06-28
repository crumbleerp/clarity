import { graphql } from 'graphql'
import { useDb } from '../../../../db'
import { schemas as schemasTable } from '../../../../db/schema/schemas'
import { eq } from 'drizzle-orm'
import { loadCache } from '../../../../services/cache'
import { buildGraphQLSchema, type FieldDef } from '../../../../services/graphql'
import { requireUser } from '../../../../utils/auth'

defineRouteMeta({
  openAPI: {
    tags: ['v1'],
    description: 'Execute a GraphQL query against a dataset',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              variables: { type: 'object' }
            },
            required: ['query']
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  requireUser(event)

  const dataset = getRouterParam(event, 'dataset')
  const body = await readBody(event)

  if (!dataset) {
    throw createError({ statusCode: 400, message: 'Dataset required' })
  }

  const { query, variables } = body
  if (!query) {
    throw createError({ statusCode: 400, message: 'query is required' })
  }

  const db = useDb()
  const schemaRows = await db.select().from(schemasTable).where(eq(schemasTable.dataset, dataset))
  const schema = buildGraphQLSchema(schemaRows.map(s => ({ name: s.name, title: s.title, fields: s.fields as FieldDef[] })))

  const allDocs = await loadCache(dataset)

  const rootValue: Record<string, (args: Record<string, string>) => unknown> = {
    _meta: () => ({ types: schemaRows.map(s => s.name) })
  }

  for (const s of schemaRows) {
    const typeName = s.name
    rootValue[`all${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`] = (_args) => {
      const limit = Number(_args.limit) || 100
      const offset = Number(_args.offset) || 0
      return allDocs
        .filter(d => d._type === typeName)
        .slice(offset, offset + limit)
        .map(d => ({ ...d, data: d }))
    }
    rootValue[`${typeName}ById`] = (_args) => {
      const d = allDocs.find(doc => doc._id === _args.id && doc._type === typeName)
      return d ? { ...d, data: d } : null
    }
  }

  const result = await graphql({
    schema,
    source: query,
    rootValue,
    variableValues: variables
  })

  return result
})
