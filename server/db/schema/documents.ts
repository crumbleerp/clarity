import { pgTable, text, timestamp, jsonb, index, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { datasets } from './datasets'

export const documentStatusEnum = pgEnum('document_status', ['draft', 'published', 'archived'])

export const documents = pgTable('documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dataset: text('dataset').notNull().default('production').references(() => datasets.name),
  type: text('type').notNull(),
  rev: text('rev').notNull().$defaultFn(() => crypto.randomUUID()),
  status: documentStatusEnum('status').notNull().default('published'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  isRevision: boolean('is_revision').notNull().default(false),
  revisionOf: text('revision_of'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  data: jsonb('data').notNull().default({})
}, table => [
  index('documents_type_idx').on(table.type),
  index('documents_dataset_idx').on(table.dataset),
  index('documents_status_idx').on(table.status),
  index('documents_deleted_at_idx').on(table.deletedAt),
  index('documents_revision_idx').on(table.isRevision)
])
