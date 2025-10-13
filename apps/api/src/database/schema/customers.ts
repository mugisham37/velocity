import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerCode: varchar('customer_code', { length: 50 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerType: varchar('customer_type', { length: 50 }).default('Individual'), // Individual, Company
  parentCustomerId: uuid('parent_customer_id'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),

  // Contact Information
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),

  // Business Information
  taxId: varchar('tax_id', { length: 50 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).default(
    '0'
  ),

  // Address Information (stored as JSON for flexibility)
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),

  // Status and Settings
  isActive: boolean('is_active').default(true).notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  parentCustomer: one(customers, {
    fields: [customers.parentCustomerId],
    references: [customers.id],
  }),
  childCustomers: many(customers),
  contacts: many(customerContacts),
}));

export const customerContacts = pgTable('customer_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  designation: varchar('designation', { length: 100 }),
  department: varchar('department', { length: 100 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerContactsRelations = relations(
  customerContacts,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerContacts.customerId],
      references: [customers.id],
    }),
  })
);

// Customer Segmentation
export const customerSegments = pgTable('customer_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  criteria: jsonb('criteria'), // Segmentation criteria as JSON
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerSegmentMemberships = pgTable(
  'customer_segment_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .references(() => customers.id)
      .notNull(),
    segmentId: uuid('segment_id')
      .references(() => customerSegments.id)
      .notNull(),
    assignedDate: timestamp('assigned_date').defaultNow().notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  }
);

// Customer Communication Preferences
export const customerCommunicationPreferences = pgTable(
  'customer_communication_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .references(() => customers.id)
      .notNull(),
    preferredChannel: varchar('preferred_channel', { length: 50 }).default(
      'EMAIL'
    ), // EMAIL, SMS, PHONE, MAIL
    emailOptIn: boolean('email_opt_in').default(true).notNull(),
    smsOptIn: boolean('sms_opt_in').default(false).notNull(),
    marketingOptIn: boolean('marketing_opt_in').default(true).notNull(),
    language: varchar('language', { length: 10 }).default('en').notNull(),
    timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Customer Portal Access
export const customerPortalUsers = pgTable('customer_portal_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  contactId: uuid('contact_id').references(() => customerContacts.id),
  username: varchar('username', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  permissions: jsonb('permissions'), // Portal permissions as JSON
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for new tables

export const customerSegmentsRelations = relations(
  customerSegments,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [customerSegments.companyId],
      references: [companies.id],
    }),
    memberships: many(customerSegmentMemberships),
  })
);

export const customerSegmentMembershipsRelations = relations(
  customerSegmentMemberships,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerSegmentMemberships.customerId],
      references: [customers.id],
    }),
    segment: one(customerSegments, {
      fields: [customerSegmentMemberships.segmentId],
      references: [customerSegments.id],
    }),
    company: one(companies, {
      fields: [customerSegmentMemberships.companyId],
      references: [companies.id],
    }),
  })
);

export const customerCommunicationPreferencesRelations = relations(
  customerCommunicationPreferences,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCommunicationPreferences.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerCommunicationPreferences.companyId],
      references: [companies.id],
    }),
  })
);

export const customerPortalUsersRelations = relations(
  customerPortalUsers,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerPortalUsers.customerId],
      references: [customers.id],
    }),
    contact: one(customerContacts, {
      fields: [customerPortalUsers.contactId],
      references: [customerContacts.id],
    }),
    company: one(companies, {
      fields: [customerPortalUsers.companyId],
      references: [companies.id],
    }),
  })
);

