import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { customers } from './customers';
import { users } from './users';

// Enums
export const leadStatusEnum = pgEnum('lead_status', [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Converted',
  'Lost',
  'Unqualified',
]);

export const leadSourceEnum = pgEnum('lead_source', [
  'Website',
  'Email Campaign',
  'Social Media',
  'Referral',
  'Cold Call',
  'Trade Show',
  'Advertisement',
  'Partner',
  'Other',
]);

export const opportunityStageEnum = pgEnum('opportunity_stage', [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
]);

export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'Draft',
  'Pending Approval',
  'Approved',
  'Confirmed',
  'Partially Delivered',
  'Delivered',
  'Partially Invoiced',
  'Invoiced',
  'Cancelled',
  'On Hold',
]);

export const quotationStatusEnum = pgEnum('quotation_status', [
  'Draft',
  'Sent',
  'Expired',
  'Accepted',
  'Rejected',
  'Cancelled',
]);

// Lead Management Tables
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadCode: varchar('lead_code', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  jobTitle: varchar('job_title', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  website: varchar('website', { length: 255 }),
  address: jsonb('address'),
  source: leadSourceEnum('source').notNull(),
  status: leadStatusEnum('status').notNull().default('New'),
  score: integer('score').default(0),
  qualificationNotes: text('qualification_notes'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  territory: varchar('territory', { length: 100 }),
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  expectedCloseDate: timestamp('expected_close_date'),
  lastContactDate: timestamp('last_contact_date'),
  nextFollowUpDate: timestamp('next_follow_up_date'),
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  isConverted: boolean('is_converted').default(false),
  convertedCustomerId: uuid('converted_customer_id').references(
    () => customers.id
  ),
  convertedOpportunityId: uuid('converted_opportunity_id'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // Call, Email, Meeting, Note, etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  activityDate: timestamp('activity_date').notNull(),
  duration: integer('duration'), // in minutes
  outcome: varchar('outcome', { length: 100 }),
  nextAction: varchar('next_action', { length: 255 }),
  nextActionDate: timestamp('next_action_date'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leadScoringRules = pgTable('lead_scoring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  criteria: jsonb('criteria').notNull(), // JSON object defining scoring criteria
  points: integer('points').notNull(),
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadAssignmentRules = pgTable('lead_assignment_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  criteria: jsonb('criteria').notNull(), // JSON object defining assignment criteria
  assignTo: uuid('assign_to')
    .references(() => users.id)
    .notNull(),
  priority: integer('priority').default(0),
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadNurturingCampaigns = pgTable('lead_nurturing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetCriteria: jsonb('target_criteria').notNull(),
  workflow: jsonb('workflow').notNull(), // JSON defining the nurturing workflow
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadCampaignEnrollments = pgTable('lead_campaign_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  campaignId: uuid('campaign_id')
    .references(() => leadNurturingCampaigns.id)
    .notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  currentStep: integer('current_step').default(0),
  status: varchar('status', { length: 50 }).default('Active'), // Active, Completed, Paused, Cancelled
  completedAt: timestamp('completed_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

// Opportunity Management Tables
export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityCode: varchar('opportunity_code', { length: 50 })
    .notNull()
    .unique(),
  name: varchar('name', { length: 255 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  leadId: uuid('lead_id').references(() => leads.id),
  stage: opportunityStageEnum('stage').notNull().default('Prospecting'),
  probability: integer('probability').default(0), // 0-100
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  expectedCloseDate: timestamp('expected_close_date'),
  actualCloseDate: timestamp('actual_close_date'),
  source: leadSourceEnum('source'),
  description: text('description'),
  nextStep: varchar('next_step', { length: 255 }),
  assignedTo: uuid('assigned_to').references(() => users.id),
  territory: varchar('territory', { length: 100 }),
  competitorInfo: jsonb('competitor_info'),
  lostReason: varchar('lost_reason', { length: 255 }),
  customFields: jsonb('custom_fields'),
  templateId: uuid('template_id').references(() => opportunityTemplates.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const opportunityStageHistory = pgTable('opportunity_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id)
    .notNull(),
  fromStage: opportunityStageEnum('from_stage'),
  toStage: opportunityStageEnum('to_stage').notNull(),
  probability: integer('probability'),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  notes: text('notes'),
  changedBy: uuid('changed_by')
    .references(() => users.id)
    .notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

export const opportunityActivities = pgTable('opportunity_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id)
    .notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  activityDate: timestamp('activity_date').notNull(),
  duration: integer('duration'),
  outcome: varchar('outcome', { length: 100 }),
  nextAction: varchar('next_action', { length: 255 }),
  nextActionDate: timestamp('next_action_date'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const opportunityCompetitors = pgTable('opportunity_competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id)
    .notNull(),
  competitorName: varchar('competitor_name', { length: 255 }).notNull(),
  strengths: text('strengths'),
  weaknesses: text('weaknesses'),
  pricing: decimal('pricing', { precision: 15, scale: 2 }),
  winProbability: integer('win_probability'), // 0-100
  notes: text('notes'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const opportunityTeamMembers = pgTable('opportunity_team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  role: varchar('role', { length: 100 }).notNull(), // Owner, Team Member, Collaborator
  accessLevel: varchar('access_level', { length: 50 }).default('Read'), // Read, Write, Full
  addedAt: timestamp('added_at').defaultNow().notNull(),
  addedBy: uuid('added_by')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

// Sales Order Management Tables
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationCode: varchar('quotation_code', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id),
  status: quotationStatusEnum('status').notNull().default('Draft'),
  validUntil: timestamp('valid_until').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default(
    '1.0000'
  ),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  totalTax: decimal('total_tax', { precision: 15, scale: 2 }).default('0'),
  totalDiscount: decimal('total_discount', { precision: 15, scale: 2 }).default(
    '0'
  ),
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull(),
  terms: text('terms'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  sentAt: timestamp('sent_at'),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id')
    .references(() => quotations.id)
    .notNull(),
  itemCode: varchar('item_code', { length: 100 }).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', {
    precision: 5,
    scale: 2,
  }).default('0'),
  discountAmount: decimal('discount_amount', {
    precision: 15,
    scale: 2,
  }).default('0'),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

export const salesOrders = pgTable('sales_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesOrderCode: varchar('sales_order_code', { length: 50 })
    .notNull()
    .unique(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  quotationId: uuid('quotation_id').references(() => quotations.id),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id),
  status: salesOrderStatusEnum('status').notNull().default('Draft'),
  orderDate: timestamp('order_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default(
    '1.0000'
  ),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  totalTax: decimal('total_tax', { precision: 15, scale: 2 }).default('0'),
  totalDiscount: decimal('total_discount', { precision: 15, scale: 2 }).default(
    '0'
  ),
  shippingCharges: decimal('shipping_charges', {
    precision: 15,
    scale: 2,
  }).default('0'),
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull(),
  advanceAmount: decimal('advance_amount', { precision: 15, scale: 2 }).default(
    '0'
  ),
  balanceAmount: decimal('balance_amount', { precision: 15, scale: 2 }),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  terms: text('terms'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  confirmedAt: timestamp('confirmed_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salesOrderItems = pgTable('sales_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesOrderId: uuid('sales_order_id')
    .references(() => salesOrders.id)
    .notNull(),
  itemCode: varchar('item_code', { length: 100 }).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  deliveredQuantity: decimal('delivered_quantity', {
    precision: 15,
    scale: 4,
  }).default('0'),
  invoicedQuantity: decimal('invoiced_quantity', {
    precision: 15,
    scale: 4,
  }).default('0'),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', {
    precision: 5,
    scale: 2,
  }).default('0'),
  discountAmount: decimal('discount_amount', {
    precision: 15,
    scale: 2,
  }).default('0'),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

// Point of Sale Tables
export const posProfiles = pgTable('pos_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  warehouseId: uuid('warehouse_id').notNull(), // Reference to warehouse
  cashAccount: uuid('cash_account').notNull(), // Reference to account
  incomeAccount: uuid('income_account').notNull(), // Reference to account
  expenseAccount: uuid('expense_account').notNull(), // Reference to account
  costCenter: varchar('cost_center', { length: 100 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  priceList: varchar('price_list', { length: 100 }),
  allowDiscount: boolean('allow_discount').default(true),
  maxDiscount: decimal('max_discount', { precision: 5, scale: 2 }).default('0'),
  allowCreditSale: boolean('allow_credit_sale').default(false),
  allowReturn: boolean('allow_return').default(true),
  printReceipt: boolean('print_receipt').default(true),
  emailReceipt: boolean('email_receipt').default(false),
  offlineMode: boolean('offline_mode').default(false),
  loyaltyProgram: varchar('loyalty_program', { length: 100 }),
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posInvoices = pgTable('pos_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceCode: varchar('invoice_code', { length: 50 }).notNull().unique(),
  posProfileId: uuid('pos_profile_id')
    .references(() => posProfiles.id)
    .notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  invoiceDate: timestamp('invoice_date').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  totalTax: decimal('total_tax', { precision: 15, scale: 2 }).default('0'),
  totalDiscount: decimal('total_discount', { precision: 15, scale: 2 }).default(
    '0'
  ),
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).notNull(),
  changeAmount: decimal('change_amount', { precision: 15, scale: 2 }).default(
    '0'
  ),
  paymentMethods: jsonb('payment_methods'), // Array of payment method details
  loyaltyPointsEarned: integer('loyalty_points_earned').default(0),
  loyaltyPointsRedeemed: integer('loyalty_points_redeemed').default(0),
  notes: text('notes'),
  isSynced: boolean('is_synced').default(false),
  syncedAt: timestamp('synced_at'),
  cashierId: uuid('cashier_id')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posInvoiceItems = pgTable('pos_invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  posInvoiceId: uuid('pos_invoice_id')
    .references(() => posInvoices.id)
    .notNull(),
  itemCode: varchar('item_code', { length: 100 }).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', {
    precision: 5,
    scale: 2,
  }).default('0'),
  discountAmount: decimal('discount_amount', {
    precision: 15,
    scale: 2,
  }).default('0'),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  serialNumbers: jsonb('serial_numbers'), // Array of serial numbers if applicable
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
});

// Sales Analytics and Reporting Tables
export const salesTargets = pgTable('sales_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(), // Revenue, Quantity, Deals
  targetPeriod: varchar('target_period', { length: 50 }).notNull(), // Monthly, Quarterly, Yearly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  achievedValue: decimal('achieved_value', { precision: 15, scale: 2 }).default(
    '0'
  ),
  assignedTo: uuid('assigned_to').references(() => users.id),
  territory: varchar('territory', { length: 100 }),
  productCategory: varchar('product_category', { length: 100 }),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Opportunity Templates Tables
export const opportunityTemplates = pgTable('opportunity_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  productLine: varchar('product_line', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  dealType: varchar('deal_type', { length: 50 }).notNull(), // New Business, Upsell, Renewal, Cross-sell
  averageDealSize: decimal('average_deal_size', { precision: 15, scale: 2 }),
  averageSalesCycle: integer('average_sales_cycle'), // in days
  customFields: jsonb('custom_fields'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const opportunityTemplateStages = pgTable(
  'opportunity_template_stages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .references(() => opportunityTemplates.id)
      .notNull(),
    stageName: varchar('stage_name', { length: 100 }).notNull(),
    stageOrder: integer('stage_order').notNull(),
    defaultProbability: integer('default_probability').notNull(), // 0-100
    requiredActivities: jsonb('required_activities'), // Array of required activity names
    exitCriteria: jsonb('exit_criteria'), // Array of criteria to exit this stage
    averageDuration: integer('average_duration'), // in days
    isRequired: boolean('is_required').default(true),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

export const opportunityTemplateActivities = pgTable(
  'opportunity_template_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .references(() => opportunityTemplates.id)
      .notNull(),
    activityName: varchar('activity_name', { length: 255 }).notNull(),
    activityType: varchar('activity_type', { length: 100 }).notNull(),
    description: text('description'),
    isRequired: boolean('is_required').default(false),
    daysFromStageStart: integer('days_from_stage_start'), // When to trigger this activity
    estimatedDuration: integer('estimated_duration'), // in minutes
    assignedRole: varchar('assigned_role', { length: 100 }), // Role that should perform this activity
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Type definitions for TypeScript
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;
export type LeadScoringRule = typeof leadScoringRules.$inferSelect;
export type NewLeadScoringRule = typeof leadScoringRules.$inferInsert;
export type LeadAssignmentRule = typeof leadAssignmentRules.$inferSelect;
export type NewLeadAssignmentRule = typeof leadAssignmentRules.$inferInsert;
export type LeadNurturingCampaign = typeof leadNurturingCampaigns.$inferSelect;
export type NewLeadNurturingCampaign =
  typeof leadNurturingCampaigns.$inferInsert;

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type OpportunityActivity = typeof opportunityActivities.$inferSelect;
export type NewOpportunityActivity = typeof opportunityActivities.$inferInsert;
export type OpportunityCompetitor = typeof opportunityCompetitors.$inferSelect;
export type NewOpportunityCompetitor =
  typeof opportunityCompetitors.$inferInsert;

export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;

export type POSProfile = typeof posProfiles.$inferSelect;
export type NewPOSProfile = typeof posProfiles.$inferInsert;
export type POSInvoice = typeof posInvoices.$inferSelect;
export type NewPOSInvoice = typeof posInvoices.$inferInsert;
export type POSInvoiceItem = typeof posInvoiceItems.$inferSelect;
export type NewPOSInvoiceItem = typeof posInvoiceItems.$inferInsert;

export type SalesTarget = typeof salesTargets.$inferSelect;
export type NewSalesTarget = typeof salesTargets.$inferInsert;

export type OpportunityTemplate = typeof opportunityTemplates.$inferSelect;
export type NewOpportunityTemplate = typeof opportunityTemplates.$inferInsert;
export type OpportunityTemplateStage =
  typeof opportunityTemplateStages.$inferSelect;
export type NewOpportunityTemplateStage =
  typeof opportunityTemplateStages.$inferInsert;
export type OpportunityTemplateActivity =
  typeof opportunityTemplateActivities.$inferSelect;
export type NewOpportunityTemplateActivity =
  typeof opportunityTemplateActivities.$inferInsert;

