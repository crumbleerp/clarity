# @crumbleerp/clarity-nuxt

Nuxt 4 module for [Clarity CMS](https://github.com/crumbleerp/clarity).

## Install

```bash
npm install @crumbleerp/clarity-nuxt
```

## Usage

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@crumbleerp/clarity-nuxt']
})
```

Create a `clarity.config.ts` in your project root:

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
- `groq` tagged template auto-import
- TypeScript definitions generated from the server schema in `types/clarity.d.ts`

## License

MIT
