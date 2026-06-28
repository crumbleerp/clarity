import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const allowedOrigins = pgTable('allowed_origins', {
  id: uuid('id').primaryKey().defaultRandom(),
  origin: text('origin').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
