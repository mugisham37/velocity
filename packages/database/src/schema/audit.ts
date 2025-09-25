import { relations } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // Table name
  entityId: uuid('entity_id').notNull(), // Record ID
  action: varchar('action', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  oldValues: jsonb('old_values'), // Previous values for UPDATE/DELETE
  newValues: jsonb('new_values'), // New values for CREATE/UPDATE
  changes: jsonb('changes'), // Specific fields that changed
  userId: uuid('user_id').references(() => users.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
}));

// Data retention policies table
export const dataRetentionPolicies = pgTable('data_retention_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  retentionPeriodDays: varchar('retention_period_days', {
    length: 10,
  }).notNull(), // e.g., "365", "FOREVER"
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: varchar('is_active', { length: 5 }).default('true').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dataRetentionPoliciesRelations = relations(
  dataRetentionPolicies,
  ({ one }) => ({
    company: one(companies, {
      fields: [dataRetentionPolicies.companyId],
      references: [companies.id],
    }),
  })
);
