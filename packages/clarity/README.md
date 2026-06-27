# @crumbleerp/clarity

JavaScript/TypeScript client for [Clarity CMS](https://github.com/crumbleerp/clarity) — a self-hosted, Sanity-compatible headless CMS.

## Install

```bash
npm install @crumbleerp/clarity
```

## Quick Start

```ts
import { createClient, groq } from '@crumbleerp/clarity'

const client = createClient({
  endpoint: 'https://cms.example.com',
  dataset: 'production'
})

const posts = await client.fetch(groq`*[_type == 'post'] | order(publishedAt desc)[0...10]`)
```

## Client

### `createClient(config)`

Creates a Clarity client instance.

```ts
const client = createClient({
  endpoint: 'https://cms.example.com',  // required — your Clarity instance URL
  dataset: 'production',                // optional — defaults to 'production'
  token: 'sk...',                       // optional — auth token (if required)
  version: '1',                         // optional — API version, defaults to '1'
  schema: postType,                     // optional — single or array of TypeDefinition
  fetch: customFetch                    // optional — custom fetch implementation
})
```

Access the configured schema via `client.schema`.

### `client.fetch<R>(query, params?, options?)`

Executes a GROQ query and returns the result.

```ts
// Simple query
const allPosts = await client.fetch(groq`*[_type == 'post']`)

// With parameters
const post = await client.fetch(
  groq`*[_type == 'post' && slug.current == $slug][0]`,
  { slug: 'hello-world' }
)

// With abort signal
const controller = new AbortController()
const result = await client.fetch(groq`*[_type == 'post']`, {}, { signal: controller.signal })
```

**Type-safe results:**

```ts
interface Post {
  _id: string
  _type: 'post'
  title: string
  body: string
}

const posts = await client.fetch<Post[]>(groq`*[_type == 'post']`)
posts[0].title // string
```

## GROQ Tag

The `groq` tagged template literal provides syntax highlighting in editors and type safety. It simply returns the interpolated string.

```ts
import { groq } from '@crumbleerp/clarity'

const query = groq`*[_type == $type && publishedAt < now()] | order(publishedAt desc)`
// same as: '*[_type == $type && publishedAt < now()] | order(publishedAt desc)'
```

## Schema Helpers

Helper functions for defining Clarity schemas in code with full TypeScript types.

### `defineType(def)`

Defines a document type.

```ts
import { defineType, defineField } from '@crumbleerp/clarity'

const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug' }),
    defineField({ name: 'body', type: 'markdown', title: 'Body' }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published At' }),
    defineField({
      name: 'author',
      type: 'reference',
      title: 'Author',
      to: [{ type: 'author' }]
    })
  ]
})
```

### `defineField(def)`

Defines a single field with type checking.

```ts
const titleField = defineField({
  name: 'title',
  type: 'string',
  title: 'Title',
  description: 'The post title',
  validation: (Rule: any) => Rule.required()
})
```

### `defineI18nField(def, locales?)`

Wraps a field into a locale-keyed object. Defaults to `['en']`.

```ts
import { defineI18nField } from '@crumbleerp/clarity'

const title = defineI18nField(
  { name: 'title', type: 'string', title: 'Title' },
  ['en', 'de', 'fr']
)

// Produces:
// { name: 'title', type: 'object', fields: [
//   { name: 'en', title: 'EN', type: 'string' },
//   { name: 'de', title: 'DE', type: 'string' },
//   { name: 'fr', title: 'FR', type: 'string' }
// ] }
```

### `createI18nField(locales)`

Returns a reusable i18n field factory for a fixed set of locales.

```ts
import { createI18nField, defineField } from '@crumbleerp/clarity'

const i18n = createI18nField(['en', 'de'])

const post = defineType({
  name: 'post',
  type: 'document',
  fields: [
    i18n({ name: 'title', type: 'string', title: 'Title' }),
    i18n({ name: 'description', type: 'text', title: 'Description' })
  ]
})
```

### `defineThemeField(def, themes?)`

Wraps a field into a theme-keyed object. Defaults to `['light', 'dark']`.

```ts
import { defineThemeField } from '@crumbleerp/clarity'

const bg = defineThemeField(
  { name: 'background', type: 'color', title: 'Background' },
  ['light', 'dark']
)

// Produces:
// { name: 'background', type: 'object', fields: [
//   { name: 'light', title: 'light', type: 'color' },
//   { name: 'dark', title: 'dark', type: 'color' }
// ] }
```

### `createThemeField(themes)`

Returns a reusable theme field factory.

```ts
import { createThemeField } from '@crumbleerp/clarity'

const themed = createThemeField(['light', 'dark'])

const fields = [
  themed({ name: 'bg', type: 'color', title: 'Background' }),
  themed({ name: 'text', type: 'color', title: 'Text Color' })
]
```

## Field Types

All supported `ClarityFieldType` values:

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
| `document` | Embedded document |
| `array` | List of items |

## TypeScript Types

All exported types:

| Type | Description |
|------|-------------|
| `ClientConfig` | Client constructor options |
| `FetchOptions` | Options for `client.fetch()` |
| `FieldDefinition` | Schema field definition |
| `TypeDefinition` | Schema type definition |
| `ClarityFieldType` | Union of all field type strings |
| `ClarityTypeType` | `'document' \| 'object'` |
| `ReferenceType` | Reference field config |
| `I18nFieldInput` | Input for `defineI18nField` |
| `ThemeFieldInput` | Input for `defineThemeField` |

## License

MIT
