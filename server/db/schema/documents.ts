import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { datasets } from './datasets'

export const documents = pgTable('documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dataset: text('dataset').notNull().default('production').references(() => datasets.name),
  type: text('type').notNull(),
  rev: text('rev').notNull().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  data: jsonb('data').notNull().default({})
}, table => [
  index('documents_type_idx').on(table.type),
  index('documents_dataset_idx').on(table.dataset)
])
