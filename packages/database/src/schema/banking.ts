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
export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  'checking',
  'savings',
  'credit_card',
  'loan',
  'investment',
  'petty_cash',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
  'transfer',
  'fee',
  'interest',
  'dividend',
  'check',
  'ach',
  'wire',
  'card_payment',
  'online_payment',
]);

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'unreconciled',
  'matched',
  'cleared',
  'disputed',
]);

export const paymentGatewayEnum = pgEnum('payment_gateway', [
  'stripe',
  'paypal',
  'square',
  'authorize_net',
  'braintree',
  'adyen',
]);

// Bank Accounts
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 100 }).notNull(),
  routingNumber: varchar('routing_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  bankAddress: text('bank_address'),
  accountType: bankAccountTypeEnum('account_type').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  lastReconciled: timestamp('last_reconciled'),
  reconciledBalance: decimal('reconciled_balance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  glAccountId: uuid('gl_account_id').references(() => accounts.id), // Link to GL account
  overdraftLimit: decimal('overdraft_limit', { precision: 15, scale: 2 }),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }),
  minimumBalance: decimal('minimum_balance', { precision: 15, scale: 2 }),
  monthlyFee: decimal('monthly_fee', { precision: 10, scale: 2 }),
  notes: text('notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank Transactions
export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  valueDate: timestamp('value_date'), // When funds are actually available
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  runningBalance: decimal('running_balance', { precision: 15, scale: 2 }),
  description: text('description').notNull(),
  reference: varchar('reference', { length: 255 }),
  checkNumber: varchar('check_number', { length: 50 }),
  payee: varchar('payee', { length: 255 }),
  category: varchar('category', { length: 100 }),
  reconciliationStatus: reconciliationStatusEnum('reconciliation_status')
    .default('unreconciled')
    .notNull(),
  reconciledDate: timestamp('reconciled_date'),
  glEntryId: uuid('gl_entry_id'), // Link to GL entry when reconciled
  isCleared: boolean('is_cleared').default(false).notNull(),
  clearedDate: timestamp('cleared_date'),
  importedFrom: varchar('imported_from', { length: 50 }), // Source of import (OFX, CSV, etc.)
  originalData: text('original_data'), // Store original import data for reference
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank Reconciliation
export const bankReconciliations = pgTable('bank_reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  reconciliationDate: timestamp('reconciliation_date').notNull(),
  statementDate: timestamp('statement_date').notNull(),
  statementBalance: decimal('statement_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  bookBalance: decimal('book_balance', { precision: 15, scale: 2 }).notNull(),
  adjustedBookBalance: decimal('adjusted_book_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  totalDepositsInTransit: decimal('total_deposits_in_transit', {
    precision: 15,
    scale: 2,
  })
    .default('0')
    .notNull(),
  totalOutstandingChecks: decimal('total_outstanding_checks', {
    precision: 15,
    scale: 2,
  })
    .default('0')
    .notNull(),
  totalBankAdjustments: decimal('total_bank_adjustments', {
    precision: 15,
    scale: 2,
  })
    .default('0')
    .notNull(),
  totalBookAdjustments: decimal('total_book_adjustments', {
    precision: 15,
    scale: 2,
  })
    .default('0')
    .notNull(),
  isBalanced: boolean('is_balanced').default(false).notNull(),
  variance: decimal('variance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  notes: text('notes'),
  reconciledBy: uuid('reconciled_by').notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reconciliation Items
export const reconciliationItems = pgTable('reconciliation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  reconciliationId: uuid('reconciliation_id')
    .references(() => bankReconciliations.id, { onDelete: 'cascade' })
    .notNull(),
  bankTransactionId: uuid('bank_transaction_id').references(
    () => bankTransactions.id
  ),
  glEntryId: uuid('gl_entry_id'), // Reference to GL entry
  itemType: varchar('item_type', { length: 50 }).notNull(), // DEPOSIT_IN_TRANSIT, OUTSTANDING_CHECK, BANK_ADJUSTMENT, BOOK_ADJUSTMENT
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description').notNull(),
  isCleared: boolean('is_cleared').default(false).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bank Statement Import
export const bankStatementImports = pgTable('bank_statement_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileFormat: varchar('file_format', { length: 20 }).notNull(), // OFX, CSV, MT940, QIF
  importDate: timestamp('import_date').defaultNow().notNull(),
  statementStartDate: timestamp('statement_start_date').notNull(),
  statementEndDate: timestamp('statement_end_date').notNull(),
  totalTransactions: integer('total_transactions').notNull(),
  successfulImports: integer('successful_imports').notNull(),
  failedImports: integer('failed_imports').notNull(),
  duplicateTransactions: integer('duplicate_transactions').notNull(),
  status: varchar('status', { length: 20 }).default('completed').notNull(), // PROCESSING, COMPLETED, FAILED
  errorLog: text('error_log'),
  importedBy: uuid('imported_by').notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cash Flow Forecasting
export const cashFlowForecasts = pgTable('cash_flow_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastName: varchar('forecast_name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  openingBalance: decimal('opening_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  projectedClosingBalance: decimal('projected_closing_balance', {
    precision: 15,
    scale: 2,
  }).notNull(),
  actualClosingBalance: decimal('actual_closing_balance', {
    precision: 15,
    scale: 2,
  }),
  variance: decimal('variance', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashFlowForecastItems = pgTable('cash_flow_forecast_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id')
    .references(() => cashFlowForecasts.id, { onDelete: 'cascade' })
    .notNull(),
  itemDate: timestamp('item_date').notNull(),
  itemType: varchar('item_type', { length: 20 }).notNull(), // INFLOW, OUTFLOW
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description').notNull(),
  projectedAmount: decimal('projected_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 15, scale: 2 }),
  variance: decimal('variance', { precision: 15, scale: 2 }),
  confidence: varchar('confidence', { length: 20 }).default('medium').notNull(), // HIGH, MEDIUM, LOW
  source: varchar('source', { length: 100 }), // Source of the forecast (HISTORICAL, BUDGET, MANUAL)
  notes: text('notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment Gateways
export const paymentGateways = pgTable('payment_gateways', {
  id: uuid('id').primaryKey().defaultRandom(),
  gatewayName: varchar('gateway_name', { length: 100 }).notNull(),
  gatewayType: paymentGatewayEnum('gateway_type').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  apiKey: varchar('api_key', { length: 255 }), // Encrypted
  secretKey: varchar('secret_key', { length: 255 }), // Encrypted
  webhookUrl: varchar('webhook_url', { length: 500 }),
  supportedCurrencies: text('supported_currencies'), // JSON array of currencies
  transactionFeePercent: decimal('transaction_fee_percent', {
    precision: 5,
    scale: 4,
  }),
  transactionFeeFixed: decimal('transaction_fee_fixed', {
    precision: 10,
    scale: 2,
  }),
  settlementDelay: integer('settlement_delay').default(2).notNull(), // Days
  configuration: text('configuration'), // JSON configuration
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Online Payments
export const onlinePayments = pgTable('online_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentGatewayId: uuid('payment_gateway_id')
    .references(() => paymentGateways.id)
    .notNull(),
  gatewayTransactionId: varchar('gateway_transaction_id', {
    length: 255,
  }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, DIGITAL_WALLET
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  netAmount: decimal('net_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // PENDING, COMPLETED, FAILED, REFUNDED
  payerName: varchar('payer_name', { length: 255 }),
  payerEmail: varchar('payer_email', { length: 255 }),
  paymentDate: timestamp('payment_date').notNull(),
  settlementDate: timestamp('settlement_date'),
  refundAmount: decimal('refund_amount', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  refundDate: timestamp('refund_date'),
  invoiceId: uuid('invoice_id'), // Reference to invoice if applicable
  customerId: uuid('customer_id'), // Reference to customer
  description: text('description'),
  gatewayResponse: text('gateway_response'), // Store gateway response for reference
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank Transfer Templates
export const bankTransferTemplates = pgTable('bank_transfer_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  description: text('description'),
  fromBankAccountId: uuid('from_bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  toBankAccountId: uuid('to_bank_account_id').references(() => bankAccounts.id),
  externalBankName: varchar('external_bank_name', { length: 255 }),
  externalAccountNumber: varchar('external_account_number', { length: 100 }),
  externalRoutingNumber: varchar('external_routing_number', { length: 50 }),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }),
  transferType: varchar('transfer_type', { length: 20 }).notNull(), // INTERNAL, EXTERNAL, WIRE
  defaultAmount: decimal('default_amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank Transfers
export const bankTransfers = pgTable('bank_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  transferNumber: varchar('transfer_number', { length: 100 }).notNull(),
  templateId: uuid('template_id').references(() => bankTransferTemplates.id),
  fromBankAccountId: uuid('from_bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  toBankAccountId: uuid('to_bank_account_id').references(() => bankAccounts.id),
  externalBankName: varchar('external_bank_name', { length: 255 }),
  externalAccountNumber: varchar('external_account_number', { length: 100 }),
  externalRoutingNumber: varchar('external_routing_number', { length: 50 }),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }),
  transferType: varchar('transfer_type', { length: 20 }).notNull(), // INTERNAL, EXTERNAL, WIRE
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  transferDate: timestamp('transfer_date').notNull(),
  valueDate: timestamp('value_date'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  approvalStatus: varchar('approval_status', { length: 20 })
    .default('pending')
    .notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  processedAt: timestamp('processed_at'),
  reference: varchar('reference', { length: 255 }),
  purpose: text('purpose'),
  notes: text('notes'),
  bankReference: varchar('bank_reference', { length: 255 }), // Bank's reference number
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    glAccount: one(accounts, {
      fields: [bankAccounts.glAccountId],
      references: [accounts.id],
    }),
    company: one(companies, {
      fields: [bankAccounts.companyId],
      references: [companies.id],
    }),
    transactions: many(bankTransactions),
    reconciliations: many(bankReconciliations),
    statementImports: many(bankStatementImports),
    transfersFrom: many(bankTransfers, { relationName: 'fromAccount' }),
    transfersTo: many(bankTransfers, { relationName: 'toAccount' }),
  })
);

export const bankTransactionsRelations = relations(
  bankTransactions,
  ({ one }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankTransactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    company: one(companies, {
      fields: [bankTransactions.companyId],
      references: [companies.id],
    }),
  })
);

export const bankReconciliationsRelations = relations(
  bankReconciliations,
  ({ one, many }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankReconciliations.bankAccountId],
      references: [bankAccounts.id],
    }),
    company: one(companies, {
      fields: [bankReconciliations.companyId],
      references: [companies.id],
    }),
    items: many(reconciliationItems),
  })
);

export const reconciliationItemsRelations = relations(
  reconciliationItems,
  ({ one }) => ({
    reconciliation: one(bankReconciliations, {
      fields: [reconciliationItems.reconciliationId],
      references: [bankReconciliations.id],
    }),
    bankTransaction: one(bankTransactions, {
      fields: [reconciliationItems.bankTransactionId],
      references: [bankTransactions.id],
    }),
    company: one(companies, {
      fields: [reconciliationItems.companyId],
      references: [companies.id],
    }),
  })
);

export const bankStatementImportsRelations = relations(
  bankStatementImports,
  ({ one }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankStatementImports.bankAccountId],
      references: [bankAccounts.id],
    }),
    company: one(companies, {
      fields: [bankStatementImports.companyId],
      references: [companies.id],
    }),
  })
);

export const cashFlowForecastsRelations = relations(
  cashFlowForecasts,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [cashFlowForecasts.companyId],
      references: [companies.id],
    }),
    items: many(cashFlowForecastItems),
  })
);

export const cashFlowForecastItemsRelations = relations(
  cashFlowForecastItems,
  ({ one }) => ({
    forecast: one(cashFlowForecasts, {
      fields: [cashFlowForecastItems.forecastId],
      references: [cashFlowForecasts.id],
    }),
    company: one(companies, {
      fields: [cashFlowForecastItems.companyId],
      references: [companies.id],
    }),
  })
);

export const paymentGatewaysRelations = relations(
  paymentGateways,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [paymentGateways.companyId],
      references: [companies.id],
    }),
    onlinePayments: many(onlinePayments),
  })
);

export const onlinePaymentsRelations = relations(onlinePayments, ({ one }) => ({
  paymentGateway: one(paymentGateways, {
    fields: [onlinePayments.paymentGatewayId],
    references: [paymentGateways.id],
  }),
  company: one(companies, {
    fields: [onlinePayments.companyId],
    references: [companies.id],
  }),
}));

export const bankTransferTemplatesRelations = relations(
  bankTransferTemplates,
  ({ one, many }) => ({
    fromBankAccount: one(bankAccounts, {
      fields: [bankTransferTemplates.fromBankAccountId],
      references: [bankAccounts.id],
      relationName: 'fromAccount',
    }),
    toBankAccount: one(bankAccounts, {
      fields: [bankTransferTemplates.toBankAccountId],
      references: [bankAccounts.id],
      relationName: 'toAccount',
    }),
    company: one(companies, {
      fields: [bankTransferTemplates.companyId],
      references: [companies.id],
    }),
    transfers: many(bankTransfers),
  })
);

export const bankTransfersRelations = relations(bankTransfers, ({ one }) => ({
  template: one(bankTransferTemplates, {
    fields: [bankTransfers.templateId],
    references: [bankTransferTemplates.id],
  }),
  fromBankAccount: one(bankAccounts, {
    fields: [bankTransfers.fromBankAccountId],
    references: [bankAccounts.id],
    relationName: 'fromAccount',
  }),
  toBankAccount: one(bankAccounts, {
    fields: [bankTransfers.toBankAccountId],
    references: [bankAccounts.id],
    relationName: 'toAccount',
  }),
  company: one(companies, {
    fields: [bankTransfers.companyId],
    references: [companies.id],
  }),
}));
