import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { companies } from './companies';
import { customers } from './customers';

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'submitted',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

export const dunningLevelEnum = pgEnum('dunning_level', [
  'first_reminder',
  'second_reminder',
  'final_notice',
  'legal_action',
]);

// Invoice Templates
export const invoiceTemplates = pgTable('invoice_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  template: text('template').notNull(), // HTML template
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice Numbering Series
export const invoiceNumberingSeries = pgTable('invoice_numbering_series', {
  id: uuid('id').primaryKey().defaultRandom(),
  seriesName: varchar('series_name', { length: 100 }).notNull(),
  prefix: varchar('prefix', { length: 20 }).notNull(),
  currentNumber: integer('current_number').default(1).notNull(),
  padLength: integer('pad_length').default(6).notNull(),
  suffix: varchar('suffix', { length: 20 }),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  outstandingAmount: decimal('outstanding_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  terms: text('terms'),
  notes: text('notes'),
  templateId: uuid('template_id').references(() => invoiceTemplates.id),
  salesOrderId: uuid('sales_order_id'), // Reference to sales order if applicable
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }), // MONTHLY, QUARTERLY, YEARLY
  nextInvoiceDate: timestamp('next_invoice_date'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice Line Items
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .references(() => invoices.id, { onDelete: 'cascade' })
    .notNull(),
  itemCode: varchar('item_code', { length: 100 }),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 4 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 })
    .default('0')
    .notNull(),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 })
    .default('0')
    .notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id), // Revenue account
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Customer Payments
export const customerPayments = pgTable('customer_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentNumber: varchar('payment_number', { length: 100 }).notNull(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // CASH, BANK_TRANSFER, CREDIT_CARD, CHECK
  reference: varchar('reference', { length: 255 }),
  bankAccountId: uuid('bank_account_id'), // Reference to bank account
  status: paymentStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  allocatedAmount: decimal('allocated_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  unallocatedAmount: decimal('unallocated_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Allocations (linking payments to invoices)
export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .references(() => customerPayments.id, { onDelete: 'cascade' })
    .notNull(),
  invoiceId: uuid('invoice_id')
    .references(() => invoices.id)
    .notNull(),
  allocatedAmount: decimal('allocated_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  allocationDate: timestamp('allocation_date').defaultNow().notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Credit Limits
export const customerCreditLimits = pgTable('customer_credit_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  isActive: boolean('is_active').default(true).notNull(),
  approvedBy: uuid('approved_by').notNull(),
  notes: text('notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit Limit Checks
export const creditLimitChecks = pgTable('credit_limit_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  checkDate: timestamp('check_date').defaultNow().notNull(),
  currentOutstanding: decimal('current_outstanding', {
    precision: 15,
    scale: 2,
  }).notNull(),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).notNull(),
  proposedAmount: decimal('proposed_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  totalExposure: decimal('total_exposure', {
    precision: 15,
    scale: 2,
  }).notNull(),
  isApproved: boolean('is_approved').notNull(),
  approvedBy: uuid('approved_by'),
  approvalNotes: text('approval_notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dunning Process
export const dunningConfigurations = pgTable('dunning_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dunningLevels = pgTable('dunning_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  configurationId: uuid('configuration_id')
    .references(() => dunningConfigurations.id, { onDelete: 'cascade' })
    .notNull(),
  level: dunningLevelEnum('level').notNull(),
  daysAfterDue: integer('days_after_due').notNull(),
  emailTemplate: text('email_template'),
  smsTemplate: text('sms_template'),
  letterTemplate: text('letter_template'),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dunningRecords = pgTable('dunning_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .references(() => invoices.id)
    .notNull(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  level: dunningLevelEnum('level').notNull(),
  dueDate: timestamp('due_date').notNull(),
  dunningDate: timestamp('dunning_date').notNull(),
  outstandingAmount: decimal('outstanding_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  emailSent: boolean('email_sent').default(false).notNull(),
  smsSent: boolean('sms_sent').default(false).notNull(),
  letterSent: boolean('letter_sent').default(false).notNull(),
  response: text('response'),
  nextDunningDate: timestamp('next_dunning_date'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Customer Statements
export const customerStatements = pgTable('customer_statements', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  statementNumber: varchar('statement_number', { length: 100 }).notNull(),
  statementDate: timestamp('statement_date').notNull(),
  fromDate: timestamp('from_date').notNull(),
  toDate: timestamp('to_date').notNull(),
  openingBalance: decimal('opening_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  closingBalance: decimal('closing_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  totalInvoices: decimal('total_invoices', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  totalPayments: decimal('total_payments', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  emailSent: boolean('email_sent').default(false).notNull(),
  emailSentAt: timestamp('email_sent_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const invoiceTemplatesRelations = relations(
  invoiceTemplates,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [invoiceTemplates.companyId],
      references: [companies.id],
    }),
    invoices: many(invoices),
  })
);

export const invoiceNumberingSeriesRelations = relations(
  invoiceNumberingSeries,
  ({ one }) => ({
    company: one(companies, {
      fields: [invoiceNumberingSeries.companyId],
      references: [companies.id],
    }),
  })
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  template: one(invoiceTemplates, {
    fields: [invoices.templateId],
    references: [invoiceTemplates.id],
  }),
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  lineItems: many(invoiceLineItems),
  paymentAllocations: many(paymentAllocations),
  dunningRecords: many(dunningRecords),
  creditLimitChecks: many(creditLimitChecks),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
    account: one(accounts, {
      fields: [invoiceLineItems.accountId],
      references: [accounts.id],
    }),
    company: one(companies, {
      fields: [invoiceLineItems.companyId],
      references: [companies.id],
    }),
  })
);

export const customerPaymentsRelations = relations(
  customerPayments,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customerPayments.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerPayments.companyId],
      references: [companies.id],
    }),
    allocations: many(paymentAllocations),
  })
);

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(customerPayments, {
      fields: [paymentAllocations.paymentId],
      references: [customerPayments.id],
    }),
    invoice: one(invoices, {
      fields: [paymentAllocations.invoiceId],
      references: [invoices.id],
    }),
    company: one(companies, {
      fields: [paymentAllocations.companyId],
      references: [companies.id],
    }),
  })
);

export const customerCreditLimitsRelations = relations(
  customerCreditLimits,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCreditLimits.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerCreditLimits.companyId],
      references: [companies.id],
    }),
  })
);

export const creditLimitChecksRelations = relations(
  creditLimitChecks,
  ({ one }) => ({
    customer: one(customers, {
      fields: [creditLimitChecks.customerId],
      references: [customers.id],
    }),
    invoice: one(invoices, {
      fields: [creditLimitChecks.invoiceId],
      references: [invoices.id],
    }),
    company: one(companies, {
      fields: [creditLimitChecks.companyId],
      references: [companies.id],
    }),
  })
);

export const dunningConfigurationsRelations = relations(
  dunningConfigurations,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [dunningConfigurations.companyId],
      references: [companies.id],
    }),
    levels: many(dunningLevels),
  })
);

export const dunningLevelsRelations = relations(dunningLevels, ({ one }) => ({
  configuration: one(dunningConfigurations, {
    fields: [dunningLevels.configurationId],
    references: [dunningConfigurations.id],
  }),
  company: one(companies, {
    fields: [dunningLevels.companyId],
    references: [companies.id],
  }),
}));

export const dunningRecordsRelations = relations(dunningRecords, ({ one }) => ({
  invoice: one(invoices, {
    fields: [dunningRecords.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [dunningRecords.customerId],
    references: [customers.id],
  }),
  company: one(companies, {
    fields: [dunningRecords.companyId],
    references: [companies.id],
  }),
}));

export const customerStatementsRelations = relations(
  customerStatements,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerStatements.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerStatements.companyId],
      references: [companies.id],
    }),
  })
);

