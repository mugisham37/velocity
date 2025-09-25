import { pgTable, uuid, varchar, timestamp, boolean, decimal, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerCode: varchar('customer_code', { length: 50 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerType: varchar('customer_type', { length: 50 }).default('Individual'), // Individual, Company
  parentCustomerId: uuid('parent_customer_id'),
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
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
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

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerContacts.customerId],
    references: [customers.id],
  }),
}));