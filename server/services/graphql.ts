import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  Kind,
  type GraphQLFieldConfigMap
} from 'graphql'

export interface FieldDef {
  name: string
  title?: string
  type: string
  description?: string
  options?: Record<string, unknown>
  fields?: FieldDef[]
  of?: FieldDef[]
  to?: Array<{ type: string }>
  validation?: unknown
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value)
      } catch {
        return ast.value
      }
    }
    return null
  }
})

interface ClaritySchema {
  name: string
  title: string
  fields: FieldDef[]
}

function buildDocumentType(name: string, _fields: FieldDef[]) {
  const fields: Record<string, { type: GraphQLScalarType }> = {
    _id: { type: GraphQLID },
    _type: { type: GraphQLString },
    _createdAt: { type: GraphQLString },
    _updatedAt: { type: GraphQLString },
    _status: { type: GraphQLString },
    _publishedAt: { type: GraphQLString },
    data: { type: JSONScalar }
  }

  return new GraphQLObjectType({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    fields
  })
}

export function buildGraphQLSchema(schemas: ClaritySchema[]) {
  const types: Record<string, GraphQLObjectType> = {}
  const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {}

  for (const schema of schemas) {
    const typeName = schema.name.charAt(0).toUpperCase() + schema.name.slice(1)
    const type = buildDocumentType(typeName, schema.fields)
    types[schema.name] = type

    queryFields[`all${typeName}`] = {
      type: new GraphQLList(type),
      args: {
        limit: { type: GraphQLString },
        offset: { type: GraphQLString }
      }
    }

    queryFields[`${schema.name}ById`] = {
      type,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      }
    }
  }

  queryFields['_meta'] = {
    type: new GraphQLObjectType({
      name: 'Meta',
      fields: {
        types: { type: new GraphQLList(GraphQLString) }
      }
    })
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryFields
    })
  })
}
