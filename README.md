<p align="center">
  <img src="header.png" alt="Clarity CMS" width="100%" />
</p>

<h1 align="center">Clarity</h1>

<p align="center">
  Open-source, self-hosted headless CMS with a Sanity-compatible API.
</p>

<p align="center">
  <a href="https://github.com/crumbleerp/clarity/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <a href="https://hub.docker.com/r/crumbleerp/clarity"><img src="https://img.shields.io/docker/pulls/crumbleerp/clarity?label=docker%20pulls"></a>
  <a href="https://www.npmjs.com/package/@crumbleerp/clarity"><img src="https://img.shields.io/npm/v/@crumbleerp/clarity"></a>
</p>

---

> [!TIP]
> Clarity is in **alpha** and under active development. APIs and features may change. Contributions and feedback are welcome!

Clarity is a self-hosted CMS that gives you a **Sanity-compatible API** on top of your own **PostgreSQL** database. Query your content with GROQ, mutate documents through a REST API, and manage everything from a built-in dashboard — no vendor lock-in, no cloud dependency.

### Why Clarity?

- **Self-Hosted** — run on your own infrastructure, no cloud dependency
- **Own your data** — everything lives in your PostgreSQL instance
- **Sanity-compatible API** — drop-in replacement for Sanity's query and mutation endpoints
- **GROQ queries** — filter, project, and order content with the same query language
- **Built-in dashboard** — schema editor, document editor, media library, GROQ playground
- **S3 media storage** — upload images and files to any S3-compatible provider
- **Multi-dataset** — manage multiple datasets (e.g. `production`, `staging`) from one instance
- **One-click Sanity import** — migrate your existing project with full asset transfer
- **Background jobs** — import and asset URL regeneration run asynchronously with live progress
- **Revision history & trash** — soft deletes, revision restore, and document history
- **Asset tagging** — tag files and query them via GROQ (`_clarity.file`)

---

## Quick Start

Copy `docker-compose.yaml` to your server and adjust the values:

```yaml
services:
  app:
    image: crumbleerp/clarity:latest
    container_name: clarity-app
    ports:
      - "3000:3000"
    environment:
      NUXT_DATABASE_URL: postgresql://clarity:clarity@postgres:5432/clarity
      NUXT_PUBLIC_DATASET: production
      NUXT_ROOT_USERNAME: admin
      NUXT_ROOT_PASSWORD: admin
      NUXT_SESSION_SECRET: some-random-secret-at-least-32-chars-long
      NUXT_PUBLIC_API_BASE_URL: "https://example.com"
      NUXT_S3_ENDPOINT: https://s3.example.com
      NUXT_S3_REGION: us-east-1
      NUXT_S3_BUCKET: clarity-bucket
      NUXT_S3_ACCESS_KEY: access-key
      NUXT_S3_SECRET_KEY: secret-key
      NUXT_S3_PUBLIC_URL: https://cdn.example.com
      NUXT_CORS_ORIGINS: ""
      NUXT_GROQ_CACHE_TTL: "0"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    container_name: clarity-postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: clarity
      POSTGRES_PASSWORD: clarity
      POSTGRES_DB: clarity
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clarity -d clarity"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  postgres-data:
```

Then start:

```bash
docker compose up -d
```

Open **your instance**, log in with the credentials you set above, and you're ready to go.

### Import data from Sanity

The fastest way to populate Clarity is to import from an existing Sanity project.

In the dashboard go to **Settings → Import from Sanity** and fill in:

| Field | Where to find it |
|-------|-------------------|
| **Project ID** | sanity.io → your project → Settings |
| **Dataset** | usually `production` |
| **Read Token** | sanity.io → API → Tokens → add a token with `View` access |

Click **Import** — all documents, schemas, and assets (images/files) will be migrated in the background.

### Connect with JS client

Install the client:

```bash
npm install @crumbleerp/clarity
```

```ts
import { createClient, groq } from '@crumbleerp/clarity'

const client = createClient({
  endpoint: 'https://cms.example.com',  // your Clarity instance
  dataset: 'production'
})

// Fetch all posts
const posts = await client.fetch(groq`*[_type == 'post'] | order(publishedAt desc)[0...10]`)

// Fetch with parameters
const post = await client.fetch(
  groq`*[_type == 'post' && slug.current == $slug][0]`,
  { slug: 'hello-world' }
)

console.log(post.title)
```

The client works with any framework — Next.js, Nuxt, SvelteKit, Astro, or plain Node.js.

---

## Deploy

### Docker (without Compose)

```bash
docker run -d \
  -p 3000:3000 \
  -e NUXT_DATABASE_URL=postgresql://user:pass@host:5432/clarity \
  -e NUXT_PUBLIC_DATASET=production \
  -e NUXT_ROOT_USERNAME=admin \
  -e NUXT_ROOT_PASSWORD=change-me \
  -e NUXT_SESSION_SECRET=your-random-secret-at-least-32-chars \
  crumbleerp/clarity:latest
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NUXT_PUBLIC_DATASET` / `DATASET` | No | `production` | Default dataset name. Created automatically on first start only if no datasets exist yet |
| `NUXT_ROOT_USERNAME` | No | `admin` | Root user login |
| `NUXT_ROOT_PASSWORD` | No | `admin` | Root user password |
| `NUXT_SESSION_SECRET` | Yes | — | Session encryption secret (min 32 chars) |
| `NUXT_PUBLIC_API_BASE_URL` / `BASE_URL` | No | — | Public API base URL (empty = same origin) |
| `NUXT_S3_ENDPOINT` | No | — | S3-compatible storage endpoint |
| `NUXT_S3_REGION` | No | `us-east-1` | S3 region |
| `NUXT_S3_BUCKET` | No | — | S3 bucket name |
| `NUXT_S3_ACCESS_KEY` | No | — | S3 access key |
| `NUXT_S3_SECRET_KEY` | No | — | S3 secret key |
| `NUXT_S3_PUBLIC_URL` | No | — | Public URL for serving uploaded assets. After changing it run **Regenerate asset URLs** in Settings |
| `NUXT_CORS_ORIGINS` | No | — | Comma-separated allowed CORS origins |
| `NUXT_GROQ_CACHE_TTL` | No | `0` | GROQ query cache TTL in seconds (`0` = disabled) |

---

## Schemas

Schemas define the structure of your documents. You can manage them from the dashboard or through the API.

### Dashboard

Navigate to **Documents → Schemas** tab and use the visual schema editor, or go to **Settings → Schemas** for the JSON importer.

```json
[
  {
    "name": "post",
    "title": "Blog Post",
    "type": "document",
    "fields": [
      {
        "name": "title",
        "type": "string",
        "title": "Title",
        "validation": [{ "type": "required" }]
      },
      { "name": "slug", "type": "slug", "title": "Slug" },
      { "name": "body", "type": "markdown", "title": "Body" },
      { "name": "publishedAt", "type": "datetime", "title": "Published At" },
      { "name": "author", "type": "reference", "title": "Author", "to": [{ "type": "author" }] }
    ]
  }
]
```

### Supported field types

| Type | Description |
|------|-------------|
| `string` | Single-line text |
| `text` | Multi-line text |
| `number` | Numeric value |
| `boolean` | Toggle switch |
| `url` | URL input |
| `email` | Email input |
| `date` | Date picker |
| `datetime` | Date & time picker |
| `color` | Color picker |
| `slug` | URL-friendly slug |
| `markdown` | Rich text (Markdown) |
| `html` | Rich text (HTML) |
| `reference` | Reference to another document |
| `image` | Image upload / media selector |
| `file` | File upload / media selector |
| `object` | Nested object with its own fields |
| `array` | List of items |
| `document` | Inline sub-document |
| `block` | Portable Text block |

### Media & Assets

Uploaded images and files are stored in your S3-compatible bucket. For every file Clarity creates:

- a `sanity.imageAsset` / `sanity.fileAsset` document for the media library;
- a hidden `_clarity.file` document with full metadata (`assetId`, `originalFilename`, `mimeType`, `extension`, `size`, `path`, `url`, `tags`, `metadata`).

`_clarity.*` types are hidden from the dashboard but fully queryable with GROQ:

```groq
*[_type == "_clarity.file" && "hero" in tags][0]
```

Tags are managed from the asset details modal. Each unique tag is also stored as a `_clarity.file_tags` document, so you can list all available tags:

```groq
*[_type == "_clarity.file_tags"]{ name, title }
```

Upload with tags:

```bash
POST /api/upload?dataset=production&tags=hero,banner
```

**Changing `S3_PUBLIC_URL`** (for example after switching CDN) does not automatically rewrite existing URLs. Go to **Settings → Danger Zone → Regenerate asset URLs** to rebuild all asset URLs from the current `S3_PUBLIC_URL`. This runs as a background job.

### JavaScript client

Use the `@crumbleerp/clarity` package to define schemas in code:

```ts
import { createClient, defineType, defineField, groq } from '@crumbleerp/clarity'

const client = createClient({
  endpoint: 'https://your-clarity-instance.com',
  dataset: 'production'
})

// Define a schema
const post = defineType({
  name: 'post',
  title: 'Blog Post',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'body', type: 'markdown', title: 'Body' })
  ]
})

// Query with GROQ
const posts = await client.fetch(groq`*[_type == 'post'] | order(publishedAt desc)`)
```

### Nuxt module

For Nuxt 4 projects install the dedicated module:

```bash
npm install @crumbleerp/clarity-nuxt
```

Add it to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@crumbleerp/clarity-nuxt'],
})
```

And create a `clarity.config.ts`:

```ts
import { defineClarityConfig, defineType, defineField } from '@crumbleerp/clarity-nuxt'

const post = defineType({
  name: 'post',
  title: 'Blog Post',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'body', type: 'markdown', title: 'Body' })
  ]
})

export default defineClarityConfig({
  endpoint: 'https://your-clarity-instance.com',
  dataset: 'production',
  token: process.env.CLARITY_TOKEN,
  schema: [post],
  publishSchema: 'dev-only'
})
```

The module auto-registers:

- `$clarity` client available via `useClarity()`
- `useClarityQuery(query, params)` — SSR-friendly composable
- `useClarityConfig()` — runtime config accessor
- `groq` tagged template
- TypeScript definitions generated from your schema in `types/clarity.d.ts`

Example page:

```vue
<script setup lang="ts">
const { data: posts } = await useClarityQuery(
  groq`*[_type == 'post'] | order(publishedAt desc)[0...10]`
)
</script>

<template>
  <ul>
    <li v-for="post in posts" :key="post._id">
      {{ post.title }}
    </li>
  </ul>
</template>
```

`publishSchema` controls whether the module pushes your local schema to the Clarity server on startup:

- `true` — always publish
- `false` — never publish
- `'dev-only'` — publish only in development (default)

---

## Sanity Compatibility

Clarity implements Sanity's public API for queries and mutations, making it a drop-in replacement for many use cases.

### What's compatible

| Feature | Status |
|---------|--------|
| `GET /v1/data/query/{dataset}` | Supported |
| `POST /v1/data/mutate/{dataset}` | Supported |
| GROQ filtering, projections, ordering | Supported |
| Parameterized queries (`$param`) | Supported |
| `create`, `createIfNotExists`, `createOrReplace` | Supported |
| `patch` with `set` / `unset` | Supported |
| `delete` mutation | Supported |
| System fields (`_id`, `_type`, `_rev`, `_createdAt`, `_updatedAt`) | Supported |
| Document references | Supported |
| Image & file assets | Supported |
| Multi-dataset | Supported |
| Required field validation | Supported |
| System types (`_clarity.*`) | Hidden in UI, queryable via GROQ |

### What's different

| Aspect | Sanity | Clarity |
|--------|--------|---------|
| Hosting | Cloud-managed | Self-hosted |
| Database | Proprietary | PostgreSQL |
| Auth | Token-based | Session-based (dashboard) |
| Pricing | Per-dataset, per-usage | Free (MIT) |
| CDN / image pipeline | Built-in | S3 + your own CDN |
| Real-time collaboration | Yes | No |
| Vision (GROQ playground) | Studio plugin | Built-in dashboard |

### Migration from Sanity

Clarity includes a one-click import tool. Go to **Settings → Import from Sanity** and provide:

- Project ID
- Dataset name
- Read token

All documents, schemas, and assets will be migrated automatically with background job tracking. Asset tags are mapped to `_clarity.file.tags` and `_clarity.file_tags`.

After import, if you change `S3_PUBLIC_URL`, run **Regenerate asset URLs** to update all asset links.

---

## API Reference

### Query content

```bash
GET /v1/data/query/{dataset}?query=*[_type == "post"]
```

### Mutate content

```bash
POST /v1/data/mutate/{dataset}
Content-Type: application/json

{
  "mutations": [
    { "create": { "_type": "post", "title": "New Post" } }
  ]
}
```

### Dashboard API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/datasets` | List datasets |
| `POST` | `/api/datasets` | Create dataset |
| `GET` | `/api/documents` | List documents |
| `POST` | `/api/documents` | Create document |
| `GET` | `/api/documents/:id` | Get document |
| `PUT` | `/api/documents/:id` | Update document |
| `DELETE` | `/api/documents/:id` | Delete document (soft) |
| `GET` | `/api/documents/:id/revisions` | List revisions |
| `POST` | `/api/documents/:id/restore` | Restore a revision |
| `GET` | `/api/documents/trash` | List deleted documents |
| `DELETE` | `/api/documents/trash` | Empty trash |
| `GET` | `/api/schemas` | List schemas |
| `POST` | `/api/schemas` | Create/update schemas |
| `DELETE` | `/api/schemas/:name` | Delete schema |
| `GET` | `/api/media` | List media assets |
| `GET` | `/api/media/:id` | Get media asset |
| `PUT` | `/api/media/:id` | Update media asset metadata |
| `DELETE` | `/api/media/:id` | Delete media asset |
| `POST` | `/api/upload` | Upload file |
| `POST` | `/api/import/sanity` | Import from Sanity (background job) |
| `GET` | `/api/jobs/:id` | Get job status |
| `POST` | `/api/admin/truncate` | Delete all documents and schemas |
| `POST` | `/api/admin/regenerate-urls` | Rebuild asset URLs from `S3_PUBLIC_URL` |
| `GET/POST/PUT/DELETE` | `/api/users` | User management (admin/root) |
| `GET/POST/DELETE` | `/api/access-tokens` | Access tokens (admin/root) |
| `GET/POST/DELETE` | `/api/allowed-origins` | CORS origins (admin/root) |

---

## Useful Resources

- [GROQ Specification](https://sanity-io.github.io/GROQ/) — full query language reference
- [groq-js](https://github.com/sanity-io/groq-js) — the GROQ parser used by Clarity
- [Drizzle ORM](https://orm.drizzle.team/) — the ORM powering the database layer
- [Nuxt UI](https://ui.nuxt.com/) — the UI framework for the dashboard
- [Sanity Documentation](https://www.sanity.io/docs) — understand the API Clarity is compatible with

---

## License

[MIT](LICENSE)
