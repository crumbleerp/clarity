import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema/*',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/clarity'
  }
})
