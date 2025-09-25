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
} from 'drizzlcore';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';
import { companies } from './companies';
import { vendors } from './vendors';

// Enums
export const billStatusEnum = pgEnum('bill_status', [
  'draft',
  'submitted',
  'approved',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('vendor_payment_status', [
  'pending',
  'scheduled',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'escalated',
]);

export const matchingStatusEnum = pgEnum('matching_status', [
  'unmatched',
  'partially_matched',
  'fully_matched',
  'exception',
]);

// Bill Templates
export const billTemplates = pgTable('bill_templates', {
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

// Bill Numbering Series
export const billNumberingSeries = pgTable('bill_numbering_series', {
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

// Vendor Bills
export const vendorBills = pgTable('vendor_bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  billNumber: varchar('bill_number', { length: 100 }).notNull(),
  vendorBillNumber: varchar('vendor_bill_number', { length: 100 }), // Vendor's own bill number
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  billDate: timestamp('bill_date').notNull(),
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
  status: billStatusEnum('status').default('draft').notNull(),
  approvalStatus: approvalStatusEnum('approval_status')
    .default('pending')
    .notNull(),
  terms: text('terms'),
  notes: text('notes'),
  templateId: uuid('template_id').references(() => billTemplates.id),
  purchaseOrderId: uuid('purchase_order_id'), // Reference to PO if applicable
  receiptId: uuid('receipt_id'), // Reference to goods receipt if applicable
  matchingStatus: matchingStatusEnum('matching_status')
    .default('unmatched')
    .notNull(),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }), // MONTHLY, QUARTERLY, YEARLY
  nextBillDate: timestamp('next_bill_date'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bill Line Items
export const billLineItems = pgTable('bill_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  billId: uuid('bill_id')
    .references(() => vendorBills.id, { onDelete: 'cascade' })
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
  accountId: uuid('account_id').references(() => accounts.id), // Expense account
  purchaseOrderLineId: uuid('purchase_order_line_id'), // Reference to PO line
  receiptLineId: uuid('receipt_line_id'), // Reference to receipt line
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vendor Payments
export const vendorPayments = pgTable('vendor_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentNumber: varchar('payment_number', { length: 100 }).notNull(),
  vendorId: uuid('vendor_id')
    .references(() => vendors.id)
    .notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // BANK_TRANSFER, CHECK, CASH, CREDIT_CARD
  reference: varchar('reference', { length: 255 }),
  bankAccountId: uuid('bank_account_id'), // Reference to bank account
  checkNumber: varchar('check_number', { length: 50 }),
  status: paymentStatusEnum('status').default('pending').notNull(),
  scheduledDate: timestamp('scheduled_date'),
  processedDate: timestamp('processed_date'),
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
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Allocations (linking payments to bills)
export const vendorPaymentAllocations = pgTable('vendor_payment_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .references(() => vendorPayments.id, { onDelete: 'cascade' })
    .notNull(),
  billId: uuid('bill_id')
    .references(() => vendorBills.id)
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

// Approval Workflows
export const approvalWorkflows = pgTable('approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  documentType: varchar('document_type', { length: 50 }).notNull(), // BILL, PAYMENT, EXPENSE
  minAmount: decimal('min_amount', { precision: 15, scale: 2 }),
  maxAmount: decimal('max_amount', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const approvalWorkflowSteps = pgTable('approval_workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .references(() => approvalWorkflows.id, { onDelete: 'cascade' })
    .notNull(),
  stepNumber: integer('step_number').notNull(),
  stepName: varchar('step_name', { length: 255 }).notNull(),
  approverId: uuid('approver_id').notNull(), // User ID
  isRequired: boolean('is_required').default(true).notNull(),
  canDelegate: boolean('can_delegate').default(false).notNull(),
  timeoutHours: integer('timeout_hours').default(24).notNull(),
  escalationUserId: uuid('escalation_user_id'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .references(() => approvalWorkflows.id)
    .notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  documentId: uuid('document_id').notNull(),
  currentStepId: uuid('current_step_id').references(
    () => approvalWorkflowSteps.id
  ),
  status: approvalStatusEnum('status').default('pending').notNull(),
  requestedBy: uuid('requested_by').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const approvalActions = pgTable('approval_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id')
    .references(() => approvalRequests.id, { onDelete: 'cascade' })
    .notNull(),
  stepId: uuid('step_id')
    .references(() => approvalWorkflowSteps.id)
    .notNull(),
  approverId: uuid('approver_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // APPROVE, REJECT, DELEGATE
  comments: text('comments'),
  delegatedTo: uuid('delegated_to'),
  actionDate: timestamp('action_date').defaultNow().notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Three-Way Matching
export const threeWayMatching = pgTable('three_way_matching', {
  id: uuid('id').primaryKey().defaultRandom(),
  billId: uuid('bill_id')
    .references(() => vendorBills.id)
    .notNull(),
  purchaseOrderId: uuid('purchase_order_id').notNull(),
  receiptId: uuid('receipt_id').notNull(),
  matchingStatus: matchingStatusEnum('status').default('unmatched').notNull(),
  quantityVariance: decimal('quantity_variance', { precision: 15, scale: 4 })
    .default('0')
    .notNull(),
  priceVariance: decimal('price_variance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  totalVariance: decimal('total_variance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  toleranceExceeded: boolean('tolerance_exceeded').default(false).notNull(),
  matchedBy: uuid('matched_by'),
  matchedAt: timestamp('matched_at'),
  exceptionReason: text('exception_reason'),
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expense Management
export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  accountId: uuid('account_id').references(() => accounts.id), // Default expense account
  parentCategoryId: uuid('parent_category_id'),
  isActive: boolean('is_active').default(true).notNull(),
  requiresReceipt: boolean('requires_receipt').default(true).notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  maxAmount: decimal('max_amount', { precision: 15, scale: 2 }),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportNumber: varchar('report_number', { length: 100 }).notNull(),
  employeeId: uuid('employee_id').notNull(), // Reference to employee
  reportDate: timestamp('report_date').notNull(),
  fromDate: timestamp('from_date').notNull(),
  toDate: timestamp('to_date').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  reimbursableAmount: decimal('reimbursable_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  status: approvalStatusEnum('status').default('pending').notNull(),
  purpose: text('purpose'),
  notes: text('notes'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  paidBy: uuid('paid_by'),
  paidAt: timestamp('paid_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const expenseItems = pgTable('expense_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .references(() => expenseReports.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: uuid('category_id')
    .references(() => expenseCategories.id)
    .notNull(),
  expenseDate: timestamp('expense_date').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 })
    .default('1.0000')
    .notNull(),
  merchantName: varchar('merchant_name', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  receiptUrl: varchar('receipt_url', { length: 500 }), // URL to uploaded receipt
  isReimbursable: boolean('is_reimbursable').default(true).notNull(),
  isBillable: boolean('is_billable').default(false).notNull(),
  customerId: uuid('customer_id'), // If billable to customer
  projectId: uuid('project_id'), // If related to project
  mileage: decimal('mileage', { precision: 10, scale: 2 }),
  mileageRate: decimal('mileage_rate', { precision: 10, scale: 4 }),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment Scheduling
export const paymentSchedules = pgTable('payment_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).notNull(), // WEEKLY, BIWEEKLY, MONTHLY
  dayOfWeek: integer('day_of_week'), // 1-7 for weekly
  dayOfMonth: integer('day_of_month'), // 1-31 for monthly
  cutoffDays: integer('cutoff_days').default(3).notNull(), // Days before payment date to include bills
  isActive: boolean('is_active').default(true).notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduledPayments = pgTable('scheduled_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .references(() => paymentSchedules.id)
    .notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  billCount: integer('bill_count').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // PENDING, PROCESSED, CANCELLED
  processedAt: timestamp('processed_at'),
  processedBy: uuid('processed_by'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const billTemplatesRelations = relations(
  billTemplates,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [billTemplates.companyId],
      references: [companies.id],
    }),
    bills: many(vendorBills),
  })
);

export const billNumberingSeriesRelations = relations(
  billNumberingSeries,
  ({ one }) => ({
    company: one(companies, {
      fields: [billNumberingSeries.companyId],
      references: [companies.id],
    }),
  })
);

export const vendorBillsRelations = relations(vendorBills, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [vendorBills.vendorId],
    references: [vendors.id],
  }),
  template: one(billTemplates, {
    fields: [vendorBills.templateId],
    references: [billTemplates.id],
  }),
  company: one(companies, {
    fields: [vendorBills.companyId],
    references: [companies.id],
  }),
  lineItems: many(billLineItems),
  paymentAllocations: many(vendorPaymentAllocations),
  threeWayMatching: many(threeWayMatching),
}));

export const billLineItemsRelations = relations(billLineItems, ({ one }) => ({
  bill: one(vendorBills, {
    fields: [billLineItems.billId],
    references: [vendorBills.id],
  }),
  account: one(accounts, {
    fields: [billLineItems.accountId],
    references: [accounts.id],
  }),
  company: one(companies, {
    fields: [billLineItems.companyId],
    references: [companies.id],
  }),
}));

export const vendorPaymentsRelations = relations(
  vendorPayments,
  ({ one, many }) => ({
    vendor: one(vendors, {
      fields: [vendorPayments.vendorId],
      references: [vendors.id],
    }),
    company: one(companies, {
      fields: [vendorPayments.companyId],
      references: [companies.id],
    }),
    allocations: many(vendorPaymentAllocations),
  })
);

export const vendorPaymentAllocationsRelations = relations(
  vendorPaymentAllocations,
  ({ one }) => ({
    payment: one(vendorPayments, {
      fields: [vendorPaymentAllocations.paymentId],
      references: [vendorPayments.id],
    }),
    bill: one(vendorBills, {
      fields: [vendorPaymentAllocations.billId],
      references: [vendorBills.id],
    }),
    company: one(companies, {
      fields: [vendorPaymentAllocations.companyId],
      references: [companies.id],
    }),
  })
);

export const approvalWorkflowsRelations = relations(
  approvalWorkflows,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [approvalWorkflows.companyId],
      references: [companies.id],
    }),
    steps: many(approvalWorkflowSteps),
    requests: many(approvalRequests),
  })
);

export const approvalWorkflowStepsRelations = relations(
  approvalWorkflowSteps,
  ({ one, many }) => ({
    workflow: one(approvalWorkflows, {
      fields: [approvalWorkflowSteps.workflowId],
      references: [approvalWorkflows.id],
    }),
    company: one(companies, {
      fields: [approvalWorkflowSteps.companyId],
      references: [companies.id],
    }),
    actions: many(approvalActions),
  })
);

export const approvalRequestsRelations = relations(
  approvalRequests,
  ({ one, many }) => ({
    workflow: one(approvalWorkflows, {
      fields: [approvalRequests.workflowId],
      references: [approvalWorkflows.id],
    }),
    currentStep: one(approvalWorkflowSteps, {
      fields: [approvalRequests.currentStepId],
      references: [approvalWorkflowSteps.id],
    }),
    company: one(companies, {
      fields: [approvalRequests.companyId],
      references: [companies.id],
    }),
    actions: many(approvalActions),
  })
);

export const approvalActionsRelations = relations(
  approvalActions,
  ({ one }) => ({
    request: one(approvalRequests, {
      fields: [approvalActions.requestId],
      references: [approvalRequests.id],
    }),
    step: one(approvalWorkflowSteps, {
      fields: [approvalActions.stepId],
      references: [approvalWorkflowSteps.id],
    }),
    company: one(companies, {
      fields: [approvalActions.companyId],
      references: [companies.id],
    }),
  })
);

export const threeWayMatchingRelations = relations(
  threeWayMatching,
  ({ one }) => ({
    bill: one(vendorBills, {
      fields: [threeWayMatching.billId],
      references: [vendorBills.id],
    }),
    company: one(companies, {
      fields: [threeWayMatching.companyId],
      references: [companies.id],
    }),
  })
);

export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [expenseCategories.accountId],
      references: [accounts.id],
    }),
    parentCategory: one(expenseCategories, {
      fields: [expenseCategories.parentCategoryId],
      references: [expenseCategories.id],
    }),
    childCategories: many(expenseCategories),
    company: one(companies, {
      fields: [expenseCategories.companyId],
      references: [companies.id],
    }),
    expenseItems: many(expenseItems),
  })
);

export const expenseReportsRelations = relations(
  expenseReports,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [expenseReports.companyId],
      references: [companies.id],
    }),
    items: many(expenseItems),
  })
);

export const expenseItemsRelations = relations(expenseItems, ({ one }) => ({
  report: one(expenseReports, {
    fields: [expenseItems.reportId],
    references: [expenseReports.id],
  }),
  category: one(expenseCategories, {
    fields: [expenseItems.categoryId],
    references: [expenseCategories.id],
  }),
  company: one(companies, {
    fields: [expenseItems.companyId],
    references: [companies.id],
  }),
}));

export const paymentSchedulesRelations = relations(
  paymentSchedules,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [paymentSchedules.companyId],
      references: [companies.id],
    }),
    scheduledPayments: many(scheduledPayments),
  })
);

export const scheduledPaymentsRelations = relations(
  scheduledPayments,
  ({ one }) => ({
    schedule: one(paymentSchedules, {
      fields: [scheduledPayments.scheduleId],
      references: [paymentSchedules.id],
    }),
    company: one(companies, {
      fields: [scheduledPayments.companyId],
      references: [companies.id],
    }),
  })
);
