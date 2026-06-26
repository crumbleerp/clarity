import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['root', 'admin', 'moderator', 'guest'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull().default('guest'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
