import { pgTable, uuid, varchar, timestamp, boolean, decimal, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountCode: varchar('account_code', { length: 50 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accountType: varchar('account_type', { length: 50 }).notNull(), // Asset, Liability, Equity, Income, Expense
  parentAccountId: uuid('parent_account_id'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isGroup: boolean('is_group').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  childAccounts: many(accounts),
  glEntries: many(glEntries),
}));

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryNumber: varchar('entry_number', { length: 50 }).notNull(),
  postingDate: timestamp('posting_date').notNull(),
  reference: varchar('reference', { length: 255 }),
  description: text('description'),
  totalDebit: decimal('total_debit', { precision: 15, scale: 2 }).notNull(),
  totalCredit: decimal('total_credit', { precision: 15, scale: 2 }).notNull(),
  isPosted: boolean('is_posted').default(false).notNull(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  glEntries: many(glEntries),
}));

export const glEntries = pgTable('gl_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  debit: decimal('debit', { precision: 15, scale: 2 }).default('0').notNull(),
  credit: decimal('credit', { precision: 15, scale: 2 }).default('0').notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const glEntriesRelations = relations(glEntries, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [glEntries.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [glEntries.accountId],
    references: [accounts.id],
  }),
  company: one(companies, {
    fields: [glEntries.companyId],
    references: [companies.id],
  }),
}));