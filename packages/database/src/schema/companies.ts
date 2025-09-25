import { pgTable, uuid, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 10 }).notNull(),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('USD'),
  settings: jsonb('settings'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  customers: many(customers),
  vendors: many(vendors),
  items: many(items),
  warehouses: many(warehouses),
}));

// Import other tables for relations (will be defined in separate files)
import { users } from './users';
import { accounts } from './accounts';
import { customers } from './customers';
import { vendors } from './vendors';
import { items } from './items';
import { warehouses } from './warehouses';