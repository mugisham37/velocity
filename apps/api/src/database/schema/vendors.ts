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

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorCode: varchar('vendor_code', { length: 50 }).notNull(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  vendorType: varchar('vendor_type', { length: 50 }).default('Company'), // Individual, Company
  parentVendorId: uuid('parent_vendor_id'),
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

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  company: one(companies, {
    fields: [vendors.companyId],
    references: [companies.id],
  }),
  parentVendor: one(vendors, {
    fields: [vendors.parentVendorId],
    references: [vendors.id],
  }),
  childVendors: many(vendors),
  contacts: many(vendorContacts),
}));

export const vendorContacts = pgTable('vendor_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
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

export const vendorContactsRelations = relations(vendorContacts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorContacts.vendorId],
    references: [vendors.id],
  }),
}));

// Vendor Performance Tracking
export const vendorPerformanceMetrics = pgTable('vendor_performance_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  metricType: varchar('metric_type', { length: 50 }).notNull(), // QUALITY, DELIVERY, COST, SERVICE
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  target: decimal('target', { precision: 10, scale: 2 }),
  unit: varchar('unit', { length: 20 }), // %, days, score, etc.
  period: varchar('period', { length: 20 }).notNull(), // MONTHLY, QUARTERLY, YEARLY
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vendor Evaluation
export const vendorEvaluations = pgTable('vendor_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  evaluationDate: timestamp('evaluation_date').notNull(),
  evaluatedBy: uuid('evaluated_by').notNull(),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }),
  deliveryScore: decimal('delivery_score', { precision: 5, scale: 2 }),
  costScore: decimal('cost_score', { precision: 5, scale: 2 }),
  serviceScore: decimal('service_score', { precision: 5, scale: 2 }),
  comments: text('comments'),
  recommendations: text('recommendations'),
  nextEvaluationDate: timestamp('next_evaluation_date'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vendor Categories
export const vendorCategories = pgTable('vendor_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentCategoryId: uuid('parent_category_id'),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorCategoryMemberships = pgTable(
  'vendor_category_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .references(() => vendors.id)
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => vendorCategories.id)
      .notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
);

// Vendor Portal Access
export const vendorPortalUsers = pgTable('vendor_portal_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  contactId: uuid('contact_id').references(() => vendorContacts.id),
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
export const vendorPerformanceMetricsRelations = relations(
  vendorPerformanceMetrics,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorPerformanceMetrics.vendorId],
      references: [vendors.id],
    }),
    company: one(companies, {
      fields: [vendorPerformanceMetrics.companyId],
      references: [companies.id],
    }),
  })
);

export const vendorEvaluationsRelations = relations(
  vendorEvaluations,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorEvaluations.vendorId],
      references: [vendors.id],
    }),
    company: one(companies, {
      fields: [vendorEvaluations.companyId],
      references: [companies.id],
    }),
  })
);

export const vendorCategoriesRelations = relations(
  vendorCategories,
  ({ one, many }) => ({
    parentCategory: one(vendorCategories, {
      fields: [vendorCategories.parentCategoryId],
      references: [vendorCategories.id],
    }),
    childCategories: many(vendorCategories),
    company: one(companies, {
      fields: [vendorCategories.companyId],
      references: [companies.id],
    }),
    memberships: many(vendorCategoryMemberships),
  })
);

export const vendorCategoryMembershipsRelations = relations(
  vendorCategoryMemberships,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorCategoryMemberships.vendorId],
      references: [vendors.id],
    }),
    category: one(vendorCategories, {
      fields: [vendorCategoryMemberships.categoryId],
      references: [vendorCategories.id],
    }),
    company: one(companies, {
      fields: [vendorCategoryMemberships.companyId],
      references: [companies.id],
    }),
  })
);

export const vendorPortalUsersRelations = relations(
  vendorPortalUsers,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorPortalUsers.vendorId],
      references: [vendors.id],
    }),
    contact: one(vendorContacts, {
      fields: [vendorPortalUsers.contactId],
      references: [vendorContacts.id],
    }),
    company: one(companies, {
      fields: [vendorPortalUsers.companyId],
      references: [companies.id],
    }),
  })
);

