import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { userRoleEnum } from './users'

export const accessTokens = pgTable('access_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  tokenPrefix: text('token_prefix').notNull(),
  role: userRoleEnum('role').notNull().default('guest'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  index('access_tokens_token_hash_idx').on(table.tokenHash)
])
