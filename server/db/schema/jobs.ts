import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core'

export const jobStatusEnum = pgEnum('job_status', ['pending', 'running', 'completed', 'failed'])

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  payload: text('payload').notNull(),
  result: text('result'),
  error: text('error'),
  logs: text('logs').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})
