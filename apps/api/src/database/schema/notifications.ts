import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // EMAIL, SMS, PUSH, IN_APP
  subject: varchar('subject', { length: 500 }),
  bodyTemplate: text('body_template').notNull(),
  variables: jsonb('variables'), // Available template variables
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // INFO, WARNING, ERROR, SUCCESS
  channel: varchar('channel', { length: 50 }).notNull(), // EMAIL, SMS, PUSH, IN_APP
  recipientId: uuid('recipient_id')
    .references(() => users.id)
    .notNull(),
  senderId: uuid('sender_id').references(() => users.id),
  entityType: varchar('entity_type', { length: 100 }), // Related entity type
  entityId: uuid('entity_id'), // Related entity ID
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // PENDING, SENT, DELIVERED, FAILED, READ
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
  metadata: jsonb('metadata'), // Additional data
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(), // e.g., 'order_created', 'payment_received'
  emailEnabled: boolean('email_enabled').default(true).notNull(),
  smsEnabled: boolean('sms_enabled').default(false).notNull(),
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  inAppEnabled: boolean('in_app_enabled').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationChannels = pgTable('notification_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // EMAIL, SMS, PUSH
  configuration: jsonb('configuration').notNull(), // Channel-specific config
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const notificationTemplatesRelations = relations(
  notificationTemplates,
  ({ one }) => ({
    company: one(companies, {
      fields: [notificationTemplates.companyId],
      references: [companies.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [notificationPreferences.companyId],
      references: [companies.id],
    }),
  })
);

export const notificationChannelsRelations = relations(
  notificationChannels,
  ({ one }) => ({
    company: one(companies, {
      fields: [notificationChannels.companyId],
      references: [companies.id],
    }),
  })
);

