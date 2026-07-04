# Clarity — AI Agent Guide

This document is a concise, accurate reference for the **Clarity** project. It is a self-hosted, open-source headless CMS that exposes a Sanity-compatible API over a PostgreSQL database.

> Read this if you are an AI agent working on the codebase. Everything below reflects the actual files in the repository, not assumptions.

---

## Project Overview

- **Name:** `clarity`
- **Type:** Nuxt 4 full-stack application with a Vue 3 dashboard and a Nitro server.
- **Goal:** Provide a drop-in, self-hosted alternative to Sanity: define schemas, store documents in PostgreSQL, query with GROQ, mutate via REST, manage assets in S3, and administer everything through a built-in dashboard.
- **Monorepo:** The repo contains the main app plus two publishable packages under `packages/`.
- **Language:** TypeScript-first; Vue SFCs use `<script setup lang="ts">`.
- **Package manager:** pnpm `11.8.0` (enforced via `packageManager`).
- **Node version:** 22 (used by CI and Dockerfile).

---

## Repository Layout

```
/                     # Root Nuxt 4 app
├── app/              # Frontend (pages, components, composables, plugins, assets)
├── server/           # Nitro backend (routes, api, services, db, middleware, plugins, utils)
├── packages/         # Publishable client packages
│   ├── clarity/      # @crumbleerp/clarity — framework-agnostic JS client
│   └── clarity-nuxt/ # @crumbleerp/clarity-nuxt — Nuxt 4 module + composables
├── test/             # Vitest tests (test/server) + separate Sanity fixture (test/package.json)
├── scripts/          # Standalone scripts (e.g. migrations runner)
├── docker/           # docker-compose.yaml reference
├── server/db/migrations/   # Drizzle-generated SQL migrations
└── server/db/schema/       # Drizzle table definitions
```

---

## Technology Stack

### Application
- **Framework:** Nuxt `^4.4.8` / Nitro / Vue `^3.5`
- **Language:** TypeScript `^6.0.3`
- **Styling:** TailwindCSS `^4.3.1` + `@nuxt/ui` `^4.9.0`
- **State / requests:** Vue `ref`/`computed`, Nuxt `useFetch`/`$fetch`, `useState`
- **Icons:** Iconify via Nuxt UI (lucide, simple-icons)
- **Rich text:** TipTap (`@tiptap/*`)
- **Code editing:** CodeMirror 6 (`codemirror`, `@codemirror/*`, `vue-codemirror`)
- **JSON viewer:** `@anilkumarthakur/vue3-json-viewer`
- **Virtual lists:** `@tanstack/vue-virtual`
- **WebGL:** `ogl` (used by the shader viewer component)

### Backend
- **ORM:** Drizzle ORM `^0.45.2` with `drizzle-kit` `^0.31.10`
- **DB driver:** `postgres` (postgres-js)
- **Database:** PostgreSQL 17 (in the provided compose file)
- **Query language:** `groq-js` for parsing/evaluating GROQ
- **GraphQL:** `graphql` + `graphql-http`
- **Object storage:** AWS SDK S3 client (`@aws-sdk/client-s3`)
- **Validation:** Zod `^4.4.3`
- **Logging:** Pino + `pino-pretty` in dev
- **IDs:** `crypto.randomUUID()` and `nanoid`

### Tooling
- **Lint:** ESLint 10 with `@nuxt/eslint`
- **Test:** Vitest `^4.1.9` via `@nuxt/test-utils/config`
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs install, lint, and typecheck on Node 22 / Ubuntu.

---

## Configuration & Environment Variables

Configuration is read from `useRuntimeConfig()`. The `nuxt.config.ts` accepts both `NUXT_*` and legacy bare env names (bare names are mostly from `.env.example`).

Required / commonly used variables:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NUXT_DATABASE_URL` / `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NUXT_SESSION_SECRET` / `SESSION_SECRET` | Yes | — | Session encryption secret (≥32 chars recommended) |
| `NUXT_ROOT_USERNAME` / `ROOT_USERNAME` | No | `admin` | Initial root user login |
| `NUXT_ROOT_PASSWORD` / `ROOT_PASSWORD` | No | `admin` | Initial root user password |
| `NUXT_PUBLIC_DATASET` / `DATASET` | No | `production` | Default dataset name (created only if no datasets exist) |
| `NUXT_PUBLIC_API_BASE_URL` / `BASE_URL` | No | — | Public API base URL (empty = same origin) |
| `NUXT_S3_ENDPOINT` / `S3_ENDPOINT` | No | — | S3-compatible endpoint |
| `NUXT_S3_REGION` / `S3_REGION` | No | `us-east-1` | S3 region |
| `NUXT_S3_BUCKET` / `S3_BUCKET` | No | — | S3 bucket |
| `NUXT_S3_ACCESS_KEY` / `S3_ACCESS_KEY` | No | — | S3 access key |
| `NUXT_S3_SECRET_KEY` / `S3_SECRET_KEY` | No | — | S3 secret key |
| `NUXT_S3_PUBLIC_URL` / `S3_PUBLIC_URL` | No | — | CDN/public URL for assets |
| `NUXT_CORS_ORIGINS` / `CORS_ORIGINS` | No | — | Comma-separated allowed origins for `/v1/data/*` |
| `NUXT_GROQ_CACHE_TTL` / `GROQ_CACHE_TTL` | No | `0` | GROQ query cache TTL in seconds (`0` = disabled) |

`.env.example` still uses the bare names; in containerized deployments the `NUXT_*` prefix is preferred.

---

## Development Commands

All commands are run from the repository root with `pnpm`.

```bash
# Install dependencies and prepare Nuxt types
pnpm install

# Start the dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint (cached)
pnpm lint

# Type-check
pnpm typecheck

# Run tests
pnpm test

# Watch tests
pnpm test:watch

# Database helpers
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Run migrations via drizzle-kit
pnpm db:push       # Push schema changes (dev)
pnpm db:studio     # Open Drizzle Studio
```

### Package commands

Each workspace package under `packages/*` has its own `package.json`:

```bash
# Build the JS client / Nuxt module from their directories
pnpm --filter @crumbleerp/clarity build
pnpm --filter @crumbleerp/clarity-nuxt build

# Publish (performed manually)
pnpm --filter @crumbleerp/clarity pub
```

The packages compile with `tsc` and output to `dist/`.

---

## Code Organization & Conventions

### Frontend (`app/`)

- **Pages:** `app/pages/`
  - `index.vue` redirects authenticated users to `/dashboard/documents`.
  - `login.vue` is the only public page.
  - `dashboard/*.vue` pages use the `auth` middleware.
- **Layout:** `app/layouts/default.vue` is the dashboard shell.
- **Components:** `app/components/`
  - Flat components for shared UI.
  - `document/*` components for the document editor/inputs.
  - `editor/RichEditor.vue` and `shader/*` are special-case components.
  - `app/components/editor/**` is ignored by ESLint.
- **Composables:** `app/composables/`
  - `useAuth`, `usePermissions`, `useCurrentDataset`, `useJobs`.
- **Plugins:** `app/plugins/`
  - `auth.ts` fetches the current user on app start.
  - `jobs.client.ts` resumes polling for background jobs in the browser.
- **Utils / types:** `app/utils/validation.ts`, `app/types/media.ts`.
- **Assets:** `app/assets/css/main.css` imports Tailwind, Nuxt UI, fonts, and theme files.

### Backend (`server/`)

- **`server/routes/`** — root-level routes (no `/api` prefix):
  - `v1/data/query/[dataset].get.ts` — Sanity-compatible GROQ query endpoint.
  - `v1/data/mutate/[dataset].post.ts` — Sanity-compatible mutation endpoint.
  - `v1/data/graphql/[dataset].post.ts` — GraphQL endpoint.
  - `api-docs.get.ts` — Swagger UI.
- **`server/api/`** — dashboard/internal REST API under `/api`:
  - `auth/*`, `documents/*`, `schemas/*`, `media/*`, `upload.post.ts`, `datasets/*`, `users/*`, `access-tokens/*`, `allowed-origins/*`, `import/sanity.post.ts`, `jobs/[id].get.ts`, `admin/*`, etc.
  - There is also a legacy/duplicate `server/api/v1/data/mutate/[dataset].post.ts` that mirrors the public mutation handler under `/api/v1/data/...`.
- **`server/services/`** — business logic:
  - `cache.ts` — in-memory document/query cache.
  - `groq.ts` — GROQ parsing/execution wrapper around `groq-js`.
  - `schema.ts` — schema CRUD.
  - `validation.ts` — document field validation (required rules, nested objects/arrays).
  - `system.ts` — hidden `_clarity.file` / `_clarity.file_tags` helpers.
  - `import.ts` — Sanity schema inference / document mapping utilities.
  - `import-worker.ts` / `regenerate-urls-worker.ts` — background job implementations.
  - `jobs.ts` — job record persistence.
  - `graphql.ts` — GraphQL schema builder.
- **`server/db/`** — database layer:
  - `index.ts` exports `useDb()` singleton using `postgres` + Drizzle.
  - `schema/*.ts` defines tables: `documents`, `schemas`, `datasets`, `users`, `jobs`, `accessTokens`, `allowedOrigins`.
  - `migrations/` contains committed Drizzle SQL migrations.
- **`server/middleware/`** — global server middleware:
  - `00_cors.ts` — CORS for `/v1/data/*`.
  - `auth.ts` — session/token authentication gate.
- **`server/plugins/`** — Nitro plugins:
  - `seed.ts` — creates default root user and dataset on startup.
  - `errorLogger.ts` — logs unhandled request errors with Pino.
- **`server/utils/`** — helpers: `auth.ts`, `accessToken.ts`, `s3.ts`, `logger.ts`, `rateLimit.ts`, `merge.ts`, `references.ts`.

### Conventions

- Use `defineEventHandler` for all server handlers.
- Use `defineRouteMeta({ openAPI: {...} })` to document endpoints consumed by `/api/openapi.json`.
- Database access goes through `useDb()`; do not create new `postgres` clients.
- S3 access goes through `useS3()` / `uploadToS3()` / `getPublicUrl()`.
- Logging goes through the Pino `logger` in `server/utils/logger.ts`.
- In-memory rate limiting lives in `server/utils/rateLimit.ts` (per-process Map).
- Vue components and composables rely on Nuxt auto-imports.
- Indentation is 2 spaces, LF, trailing whitespace trimmed (`.editorconfig`).
- ESLint stylistic rules: `commaDangle: 'never'`, `braceStyle: '1tbs'`.

---

## Database & Migrations

- Schema source: `server/db/schema/*`.
- Migrations output: `server/db/migrations`.
- Dialect: PostgreSQL.
- Drizzle config: `drizzle.config.ts`.
- The production Docker image runs `scripts/migrate.mjs` before starting the server, applying migrations from `/app/migrations`.
- In development you can also use `pnpm db:push`, but committed migrations are the source of truth for production.

### Key tables

- `datasets` — named datasets (`production`, `staging`, …).
- `schemas` — per-dataset document/object schemas (JSON `fields` column).
- `documents` — all content, revisions, assets, and hidden system documents (`_clarity.*`).
- `users` — dashboard users with roles `root`, `admin`, `moderator`, `guest`.
- `access_tokens` — hashed bearer tokens for API access.
- `allowed_origins` — CORS origin allow-list.
- `jobs` — background job records.

---

## Authentication & Authorization

### Dashboard users
- Session-based auth via `h3` sessions, encrypted with `NUXT_SESSION_SECRET`.
- Roles: `root` > `admin` > `moderator` > `guest`.
- `guest` is read-only and cannot access `/dashboard/settings`.
- `moderator` and above can create/edit documents, schemas, media, and imports.
- `admin` and `root` can manage users, access tokens, CORS origins, and datasets.
- Only `root` can truncate all data.

### API access tokens
- Tokens have the prefix `sk-clarity-`.
- Stored as SHA256 hashes; the plaintext is shown only once on creation.
- They authenticate requests to protected `/api/*` and `/v1/data/mutate/*` endpoints via `Authorization: Bearer <token>`.

### Middleware
- `server/middleware/00_cors.ts` applies CORS headers to `/v1/data/*` based on `allowed_origins`.
- `server/middleware/auth.ts` protects `/api/*` and `/v1/data/mutate/*`. Public paths: `/api/auth/login`, `/api/auth/logout`, `/v1/data/query/*`.

---

## API Surface

### Sanity-compatible endpoints
- `GET /v1/data/query/{dataset}?query=...&params=...&perspective=...`
- `POST /v1/data/mutate/{dataset}` with `{ mutations: [...] }`
- `POST /v1/data/graphql/{dataset}` (GraphQL)

Supported mutation operations: `create`, `createIfNotExists`, `createOrReplace`, `patch` (`set`/`unset`), `delete`.

### Dashboard / internal REST API
Key routes (all under `/api`):

- Auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Datasets: `GET|POST /api/datasets`
- Documents: `GET|POST /api/documents`, `GET|PUT|DELETE /api/documents/:id`, `GET /api/documents/trash`, `DELETE /api/documents/trash`, `GET|POST /api/documents/:id/revisions`, `POST /api/documents/:id/restore`
- Schemas: `GET|POST /api/schemas`, `DELETE /api/schemas/:name`
- Media: `GET /api/media`, `GET|PUT|DELETE /api/media/:id`, `POST /api/upload`
- Import: `POST /api/import/sanity`
- Jobs: `GET /api/jobs/:id`
- Admin: `POST /api/admin/truncate`, `POST /api/admin/regenerate-urls`
- Users: `GET|POST /api/users`, `PUT /api/users/:id`
- Access tokens: `GET|POST /api/access-tokens`, `PUT|DELETE /api/access-tokens/:id`
- CORS origins: `GET|POST /api/allowed-origins`, `DELETE /api/allowed-origins/:id`
- System: `GET /api/health`, `GET /api-docs`, `GET /api/openapi.json`

The OpenAPI spec is hand-written in `server/api/openapi.json.get.ts` and served by Swagger UI at `/api-docs`.

---

## Background Jobs

- Jobs are persisted in the `jobs` table via `server/services/jobs.ts`.
- Two job types exist today:
  1. **`import`** — `server/services/import-worker.ts` downloads documents and assets from Sanity, uploads assets to S3, and inserts documents.
  2. **`regenerate-urls`** — `server/services/regenerate-urls-worker.ts` rebuilds asset URLs from the current `S3_PUBLIC_URL`.
- Workers are started **fire-and-forget** from the API handler (`runImportJob(...).catch(...)`).
- The dashboard polls job status via `GET /api/jobs/:id` and surfaces progress with `useJobs`.
- Because workers run inside the app process, in a multi-instance deployment the instance that created the job executes it; status is shared via the database.

---

## Caching

- **Dataset cache:** `server/services/cache.ts` keeps an in-memory `Map` of hydrated documents per dataset/perspective.
- **Query cache:** Optional TTL-based cache for GROQ queries controlled by `NUXT_GROQ_CACHE_TTL`.
- Cache is invalidated on document/schema writes.
- There is no Redis or shared cache; running multiple instances can produce stale in-memory caches until each instance receives a mutating request.

---

## Media & Assets

- Uploads go to the configured S3 bucket under `assets/{assetId}.{ext}`.
- `POST /api/upload?dataset=...&tags=...` accepts multipart file data.
- Each upload creates:
  - A `sanity.imageAsset` or `sanity.fileAsset` document for the media library.
  - A hidden `_clarity.file` document with full metadata (`assetId`, `originalFilename`, `mimeType`, `extension`, `size`, `path`, `url`, `tags`, `metadata`).
- Tags are also stored as `_clarity.file_tags` documents and are queryable via GROQ.
- Changing `S3_PUBLIC_URL` does not rewrite existing URLs automatically; use **Settings → Danger Zone → Regenerate asset URLs**.

---

## Testing

- Test runner: Vitest, configured in `vitest.config.ts` with `@nuxt/test-utils/config`.
- Environment: `node`, `globals: true`.
- Test files:
  - `test/server/utils/auth.test.ts`
  - `test/server/utils/merge.test.ts`
  - `test/server/services/import.test.ts`
- Run with `pnpm test` or `pnpm test:watch`.
- Note: `test/` also contains a separate Sanity fixture (`test/package.json`, `test/sanity.config.ts`, `test/schema/`, etc.) that is **not** executed by the root Vitest command. It uses its own Bun lockfile and dependencies.
- CI currently runs `pnpm install`, `pnpm lint`, and `pnpm typecheck`; it does not run `pnpm test`.

---

## Linting & Formatting

- **ESLint:** `eslint.config.mjs` uses `@nuxt/eslint` with stylistic overrides.
  - `commaDangle: 'never'`
  - `braceStyle: '1tbs'`
  - `app/components/editor/**` is ignored.
- Run `pnpm lint`.
- **EditorConfig:** 2-space indentation, LF, UTF-8, final newline.

---

## Deployment

### Docker (production)

- `Dockerfile` is a multi-stage build:
  1. Build stage: installs deps with `pnpm install --frozen-lockfile`, runs `pnpm build`, and copies `postgres`/`drizzle-orm` into `migrate-deps`.
  2. Runtime stage: copies `.output`, migrations, `migrate.mjs`, and `entrypoint.sh`; runs as `node` user; exposes port `3000`.
- `entrypoint.sh` runs `node /app/migrate.mjs` then `node /app/.output/server/index.mjs`.
- `docker/docker-compose.yaml` shows a reference setup with a PostgreSQL 17 service.

### Manual / Node

1. Set environment variables.
2. Run `pnpm install && pnpm build`.
3. Run migrations: `node scripts/migrate.mjs` (or set `DATABASE_URL`/`NUXT_DATABASE_URL`).
4. Start: `node .output/server/index.mjs`.

The app listens on `process.env.PORT` or Nuxt's default (Dockerfile sets `PORT=3000`).

---

## Security Considerations

- **Default credentials:** The root user defaults to `admin`/`admin`. This must be overridden in production via `NUXT_ROOT_USERNAME` / `NUXT_ROOT_PASSWORD`.
- **Session secret:** `NUXT_SESSION_SECRET` should be at least 32 random characters.
- **Password storage:** Dashboard passwords are stored and compared in plaintext in the `users.password` column. Treat the database as sensitive.
- **Access tokens:** Tokens are hashed with SHA256 before storage; only the plaintext is shown once on creation.
- **CORS:** `NUXT_CORS_ORIGINS` controls browser access to `/v1/data/*`. Use `*` only with care.
- **S3 credentials:** Stored in runtime config (environment variables). Keep them out of source control.
- **Rate limiting:** Login is rate-limited in-memory per IP (`server/utils/rateLimit.ts`). It is per-process and resets on restart.
- **Authorization:** Most write endpoints enforce `requireModeratorOrAbove` or stricter helpers. Do not lower these guards without review.
- **Background jobs:** Import jobs fetch external URLs (Sanity asset CDN) and write to S3/DB. Validate inputs and keep tokens scoped.

---

## Notes for AI Agents

- Always use `useDb()` and `useS3()` singletons rather than instantiating clients directly.
- Always invalidate cache after mutating documents or schemas (`invalidateCache(dataset)`).
- When adding a new API endpoint, consider adding `defineRouteMeta({ openAPI: {...} })` so it appears in `/api/openapi.json`.
- The `documents` table is generic: content lives in the `data` JSONB column; system fields are merged in/out by `mergeDocument()`.
- Hidden system types use the prefix `_clarity.` and are filtered from the dashboard list by default, but they are fully queryable via GROQ.
- The two publishable packages are plain TypeScript packages built with `tsc`. Do not add heavy runtime dependencies to them without good reason.
- Do not commit `.env` files. Copy `.env.example` to `.env` for local development and adjust values.
