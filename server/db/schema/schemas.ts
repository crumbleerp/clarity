import { pgTable, text, timestamp, uuid, jsonb, unique } from 'drizzle-orm/pg-core'
import { datasets } from './datasets'

export const schemas = pgTable('schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  schemaType: text('schema_type').notNull().default('document'),
  fields: jsonb('fields').notNull().default([]),
  dataset: text('dataset').notNull().references(() => datasets.name),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  unique('schemas_name_dataset_unique').on(table.name, table.dataset)
])
