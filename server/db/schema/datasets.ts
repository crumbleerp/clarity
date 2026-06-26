import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const datasets = pgTable('datasets', {
  name: text('name').primaryKey(),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
