# AGENTS.md — Clarity CMS (OSS Sanity Alternative)

## Overview

Clarity — open-source замена Sanity CMS. Nuxt 4 + Nuxt UI dashboard + Drizzle ORM + groq-js. PostgreSQL для хранения данных, GROQ для запросов.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Nuxt UI Dashboard (app/)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│  │ Schema   │ │ Document │ │ Preview /    ││
│  │ Editor   │ │ Editor   │ │ Live View    ││
│  └──────────┘ └──────────┘ └──────────────┘│
├─────────────────────────────────────────────┤
│  API Layer (server/api/)                     │
│  /v1/data/query/{dataset}   — GET (GROQ)    │
│  /v1/data/mutate/{dataset}  — POST          │
│  /api/auth/*                — login/logout   │
│  /api/schemas              — schema CRUD     │
│  /api/documents             — document CRUD  │
├─────────────────────────────────────────────┤
│  Services (server/services/)                 │
│  CacheService  — in-memory table cache      │
│  GroqService   — groq-js query execution    │
│  SchemaService — schema validation          │
├─────────────────────────────────────────────┤
│  Drizzle ORM (server/db/)                    │
│  ┌─────────────┐  ┌────────────────────┐    │
│  │ documents   │  │ schemas            │    │
│  │ (dataset)   │  │ (schema registry)  │    │
│  └─────────────┘  └────────────────────┘    │
│  ┌─────────────┐                            │
│  │ users       │                            │
│  └─────────────┘                            │
├─────────────────────────────────────────────┤
│  PostgreSQL                                  │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 |
| UI | Nuxt UI 4 (dashboard template) |
| ORM | Drizzle ORM (postgres) |
| Database | PostgreSQL |
| Query Language | groq-js |
| Auth | Session-based (nitro session utils) |
| Package Manager | pnpm |

## Database Schema

### Table: `documents`

The main data table. Dataset name is set via env (`DATASET`), each dataset is a separate PostgreSQL schema or suffixed table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Maps to `_id` and `_originalId` |
| `type` | text (indexed) | Maps to `_type` (e.g. "skill", "project") |
| `rev` | UUID | Maps to `_rev` — current revision ID |
| `created_at` | timestamptz | Maps to `_createdAt` |
| `updated_at` | timestamptz | Maps to `_updatedAt` |
| `data` | jsonb | User-defined fields (everything without `_` prefix) |

### Table: `schemas`

Stores schema definitions per dataset.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Schema entry ID |
| `name` | text (unique) | Document type name (e.g. "skill", "project") |
| `title` | text | Human-readable title |
| `schema_type` | text | Always "document" for top-level types |
| `fields` | jsonb | Array of field definitions |
| `dataset` | text | Dataset this schema belongs to |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

### Table: `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | User ID |
| `username` | text (unique) | Login username |
| `password` | text | Plain text password |
| `role` | enum | `root`, `admin`, `moderator`, `guest` |
| `created_at` | timestamptz | Created timestamp |

Root user is seeded from `ROOT_USERNAME` / `ROOT_PASSWORD` env vars (default: `admin` / `admin`).

## System Fields Mapping

When returning document data, system columns are merged with `data` JSON:

```json
{
  "_id": "063168bc-3cc1-46dc-a4d8-e8f81ed222ca",
  "_originalId": "063168bc-3cc1-46dc-a4d8-e8f81ed222ca",
  "_rev": "063168bc-3cc1-46dc-a4d8-e8f81ed222c5",
  "_createdAt": "2026-03-17T13:57:17Z",
  "_updatedAt": "2026-03-17T15:48:53Z",
  "_type": "skill",
  "name": "TypeScript",
  "color": "#3178C6",
  ...
}
```

## Caching Strategy

1. On first request (or after mutation) — load ALL documents for the dataset into an in-memory array
2. Cache the full array in a Nitro/H3 state singleton
3. On query — fetch from cache, pass array through `groq-js` for filtering/projection
4. On mutation (create/update/delete) — invalidate cache
5. Cache key = dataset name (from env)

## API Endpoints

### Sanity-Compatible

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/data/query/{dataset}` | GROQ query. Params: `query`, `perspective` |
| `POST` | `/v1/data/mutate/{dataset}` | Create/update/delete. Body: `{mutations: [...]}` |

### Dashboard API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login with username/password |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user info |
| `GET` | `/api/schemas` | List all schemas |
| `POST` | `/api/schemas` | Create/update schemas |
| `DELETE` | `/api/schemas/:name` | Delete schema |
| `GET` | `/api/documents` | List documents (with pagination) |
| `GET` | `/api/documents/:id` | Get single document |
| `POST` | `/api/documents` | Create document |
| `PUT` | `/api/documents/:id` | Update document |
| `DELETE` | `/api/documents/:id` | Delete document |

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/clarity

# Dataset (used as table suffix or schema prefix)
DATASET=production

# Root user (auto-created on startup)
ROOT_USERNAME=admin
ROOT_PASSWORD=admin

# Session
NUXT_SESSION_SECRET=some-random-secret
```

## Directory Structure (Target)

```
clarity/
├── app/
│   ├── app.vue
│   ├── app.config.ts
│   ├── assets/css/
│   ├── components/
│   ├── layouts/
│   │   └── default.vue          # Dashboard layout with sidebar
│   ├── middleware/
│   │   └── auth.ts              # Route guard
│   ├── pages/
│   │   ├── index.vue            # Redirect to dashboard
│   │   ├── login.vue            # Login page
│   │   └── dashboard/
│   │       ├── index.vue        # Overview / stats
│   │       ├── schemas.vue      # Schema management
│   │       ├── documents/
│   │       │   ├── index.vue    # Document list by type
│   │       │   └── [id].vue     # Document editor
│   │       └── settings.vue     # Settings
│   └── composables/
│       └── useAuth.ts
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── logout.post.ts
│   │   │   └── me.get.ts
│   │   ├── schemas/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [name].delete.ts
│   │   ├── documents/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   └── v1/
│   │       └── data/
│   │           ├── query/
│   │           │   └── [dataset].get.ts
│   │           └── mutate/
│   │               └── [dataset].post.ts
│   ├── db/
│   │   ├── index.ts             # Drizzle client
│   │   ├── schema/
│   │   │   ├── documents.ts
│   │   │   ├── schemas.ts
│   │   │   └── users.ts
│   │   └── migrations/          # Auto-generated
│   ├── middleware/
│   │   └── auth.ts              # Server-side auth middleware
│   ├── plugins/
│   │   └── seed.ts              # Seed root user on startup
│   ├── services/
│   │   ├── cache.ts             # In-memory document cache
│   │   ├── groq.ts              # GROQ query executor
│   │   └── schema.ts            # Schema validation
│   ├── utils/
│   │   ├── auth.ts              # Session helpers
│   │   └── merge.ts             # Merge system fields + data
│   └── drizzle.config.ts
├── drizzle.config.ts
├── .env.example
└── AGENTS.md
```

## Implementation Plan

### Phase 1: Project Setup + Database
- [ ] Install dependencies: `drizzle-orm`, `postgres`, `groq-js`, `drizzle-kit`, `nanoid`
- [ ] Setup `.env.example`
- [ ] Configure `nuxt.config.ts` with session
- [ ] Create Drizzle schema files (`documents`, `schemas`, `users`)
- [ ] Configure Drizzle + postgres driver
- [ ] Create initial migration
- [ ] Create seed plugin (root user from env)

### Phase 2: Core Services + Utilities
- [ ] `merge.ts` — merge system fields with `data` JSON into single object
- [ ] `CacheService` — load/cache all documents per dataset in memory
- [ ] `GroqService` — execute GROQ queries against cached data using groq-js
- [ ] `SchemaService` — store/retrieve/validate schemas

### Phase 3: Auth API
- [ ] Session helpers (server/utils/auth.ts)
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/auth/me`
- [ ] Server-side auth middleware

### Phase 4: Schema + Document CRUD API
- [ ] `GET /api/schemas` — list all schemas
- [ ] `POST /api/schemas` — create/update schemas
- [ ] `DELETE /api/schemas/:name` — delete schema
- [ ] `GET /api/documents` — list documents (pagination)
- [ ] `GET /api/documents/:id` — single document
- [ ] `POST /api/documents` — create document
- [ ] `PUT /api/documents/:id` — update document
- [ ] `DELETE /api/documents/:id` — delete document

### Phase 5: Sanity-Compatible API
- [ ] `GET /v1/data/query/[dataset]` — GROQ query endpoint
- [ ] `POST /v1/data/mutate/[dataset]` — mutations (create, createIfNotExists, createOrReplace, patch, delete)
- [ ] Error responses matching Sanity format

### Phase 6: Dashboard UI (later)
- [ ] Replace starter with Nuxt UI dashboard template
- [ ] Login page
- [ ] Dashboard layout with sidebar navigation
- [ ] Schema editor page (JSON input + preview)
- [ ] Document list page (filter by type, pagination)
- [ ] Document editor page (dynamic form based on schema)
- [ ] Overview / stats page

### Phase 7: Polish
- [ ] Input validation and error handling
- [ ] Role-based access control (basic)
- [ ] Test GROQ query compatibility
- [ ] `.env.example` documentation

## Conventions

- TypeScript strict mode
- No comments in code unless explicitly asked
- Use `nanoid` for generating IDs (Sanity-compatible format)
- All dates in ISO 8601 format
- Server routes follow H3/Nitro conventions
- Use Drizzle's `sql` template literals for raw queries
- Cache invalidation on any write operation