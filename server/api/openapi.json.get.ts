export default defineEventHandler(() => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Clarity CMS API',
      version: '1.0.0',
      description: 'Sanity-compatible headless CMS API'
    },
    servers: [
      { url: '' }
    ],
    tags: [
      { name: 'auth', description: 'Authentication' },
      { name: 'documents', description: 'Document CRUD' },
      { name: 'schemas', description: 'Schema management' },
      { name: 'media', description: 'Media assets' },
      { name: 'v1', description: 'Sanity-compatible API' },
      { name: 'system', description: 'System endpoints' }
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['system'],
          summary: 'Health check',
          responses: {
            200: { description: 'Service is healthy' },
            503: { description: 'Database unavailable' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['auth'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  },
                  required: ['username', 'password']
                }
              }
            }
          },
          responses: {
            200: { description: 'Authenticated' },
            401: { description: 'Invalid credentials' },
            429: { description: 'Too many requests' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['auth'],
          summary: 'Current user',
          responses: {
            200: { description: 'Current user info' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/documents': {
        get: {
          tags: ['documents'],
          summary: 'List documents',
          parameters: [
            { name: 'dataset', in: 'query', schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'offset', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'includeDrafts', in: 'query', schema: { type: 'boolean' } }
          ],
          responses: {
            200: { description: 'List of documents' }
          }
        },
        post: {
          tags: ['documents'],
          summary: 'Create document',
          responses: {
            200: { description: 'Document created' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/api/documents/{id}': {
        get: {
          tags: ['documents'],
          summary: 'Get document',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Document' } }
        },
        put: {
          tags: ['documents'],
          summary: 'Update document',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Document updated' } }
        },
        delete: {
          tags: ['documents'],
          summary: 'Soft delete document',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'permanent', in: 'query', schema: { type: 'boolean' } },
            { name: 'force', in: 'query', schema: { type: 'boolean' } }
          ],
          responses: { 200: { description: 'Document deleted' } }
        }
      },
      '/api/documents/{id}/restore': {
        post: {
          tags: ['documents'],
          summary: 'Restore soft-deleted document',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Document restored' } }
        }
      },
      '/api/documents/{id}/revisions': {
        get: {
          tags: ['documents'],
          summary: 'List document revisions',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Revisions' } }
        }
      },
      '/api/documents/trash': {
        get: {
          tags: ['documents'],
          summary: 'List trashed documents',
          responses: { 200: { description: 'Trashed documents' } }
        },
        delete: {
          tags: ['documents'],
          summary: 'Empty trash',
          responses: { 200: { description: 'Trash emptied' } }
        }
      },
      '/api/schemas': {
        get: {
          tags: ['schemas'],
          summary: 'List schemas',
          responses: { 200: { description: 'Schemas' } }
        },
        post: {
          tags: ['schemas'],
          summary: 'Create or update schemas',
          responses: { 200: { description: 'Schemas saved' } }
        }
      },
      '/api/schemas/{name}': {
        delete: {
          tags: ['schemas'],
          summary: 'Delete schema',
          parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Schema deleted' } }
        }
      },
      '/api/media': {
        get: {
          tags: ['media'],
          summary: 'List media assets',
          responses: { 200: { description: 'Media assets' } }
        }
      },
      '/api/upload': {
        post: {
          tags: ['media'],
          summary: 'Upload file',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } }
              }
            }
          },
          responses: { 200: { description: 'File uploaded' } }
        }
      },
      '/v1/data/query/{dataset}': {
        get: {
          tags: ['v1'],
          summary: 'GROQ query',
          parameters: [
            { name: 'dataset', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'query', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'params', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Query result' } }
        }
      },
      '/v1/data/mutate/{dataset}': {
        post: {
          tags: ['v1'],
          summary: 'Sanity-compatible mutations',
          parameters: [{ name: 'dataset', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mutations: { type: 'array' }
                  },
                  required: ['mutations']
                }
              }
            }
          },
          responses: { 200: { description: 'Mutation result' } }
        }
      },
      '/v1/data/graphql/{dataset}': {
        post: {
          tags: ['v1'],
          summary: 'GraphQL query',
          parameters: [{ name: 'dataset', in: 'path', required: true, schema: { type: 'string' } }],
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
          },
          responses: { 200: { description: 'GraphQL result' } }
        }
      }
    }
  }
})
