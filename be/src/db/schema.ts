import { pgEnum, pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'paused',
  'abandoned',
  'done',
]);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: projectStatusEnum('status').notNull().default('active'),
  date: text('date').notNull(),
  dateLabel: text('date_label').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
