import { pgTable, uuid, varchar, timestamp, boolean, decimal, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorCode: varchar('vendor_code', { length: 50 }).notNull(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  vendorType: varchar('vendor_type', { length: 50 }).default('Company'), // Individual, Company
  parentVendorId: uuid('parent_vendor_id'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  
  // Contact Information
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  
  // Business Information
  taxId: varchar('tax_id', { length: 50 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).default('0'),
  
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
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
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