import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { assets } from './assets';
import { companies } from './companies';
import { users } from './users';

// Depreciation Schedules
export const depreciationSchedules = pgTable(
  'depreciation_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    scheduleNumber: varchar('schedule_number', { length: 50 }).notNull(),

    // Depreciation Configuration
    depreciationMethod: varchar('depreciation_method', {
      length: 50,
    }).notNull(), // Straight Line, Declining Balance, Units of Production, Sum of Years Digits
    usefulLife: integer('useful_life').notNull(), // in months
    salvageValue: decimal('salvage_value', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Financial Details
    assetCost: decimal('asset_cost', { precision: 15, scale: 2 }).notNull(),
    depreciableAmount: decimal('depreciable_amount', {
      precision: 15,
      scale: 2,
    }).notNull(),

    // Method-specific Parameters
    depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 2 }), // For declining balance
    unitsOfProduction: integer('units_of_production'), // For units of production method

    // Schedule Dates
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),

    // Tax Depreciation (Book vs Tax differences)
    taxDepreciationMethod: varchar('tax_depreciation_method', { length: 50 }),
    taxUsefulLife: integer('tax_useful_life'),
    taxSalvageValue: decimal('tax_salvage_value', { precision: 15, scale: 2 }),

    // Status and Control
    status: varchar('status', { length: 50 }).default('Active'), // Active, Suspended, Completed
    isActive: boolean('is_active').default(true).notNull(),

    // GL Account Mappings
    assetAccountId: uuid('asset_account_id').references(() => accounts.id),
    depreciationExpenseAccountId: uuid(
      'depreciation_expense_account_id'
    ).references(() => accounts.id),
    accumulatedDepreciationAccountId: uuid(
      'accumulated_depreciation_account_id'
    ).references(() => accounts.id),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    scheduleNumberCompanyIdx: unique().on(
      table.scheduleNumber,
      table.companyId
    ),
    assetIdx: index().on(table.assetId),
    statusIdx: index().on(table.status),
    startDateIdx: index().on(table.startDate),
  })
);

// Depreciation Entries (Individual depreciation postings)
export const depreciationEntries = pgTable(
  'depreciation_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id')
      .references(() => depreciationSchedules.id)
      .notNull(),
    entryNumber: varchar('entry_number', { length: 50 }).notNull(),

    // Period Information
    depreciationDate: timestamp('depreciation_date').notNull(),
    periodStartDate: timestamp('period_start_date').notNull(),
    periodEndDate: timestamp('period_end_date').notNull(),

    // Financial Amounts
    depreciationAmount: decimal('depreciation_amount', {
      precision: 15,
      scale: 2,
    }).notNull(),
    accumulatedDepreciation: decimal('accumulated_depreciation', {
      precision: 15,
      scale: 2,
    }).notNull(),
    bookValue: decimal('book_value', { precision: 15, scale: 2 }).notNull(),

    // Tax Depreciation
    taxDepreciationAmount: decimal('tax_depreciation_amount', {
      precision: 15,
      scale: 2,
    }),
    taxAccumulatedDepreciation: decimal('tax_accumulated_depreciation', {
      precision: 15,
      scale: 2,
    }),
    taxBookValue: decimal('tax_book_value', { precision: 15, scale: 2 }),

    // Units of Production specific
    actualUnitsProduced: integer('actual_units_produced'),

    // GL Integration
    glEntryId: uuid('gl_entry_id'), // Reference to GL entry if posted
    isPosted: boolean('is_posted').default(false).notNull(),
    postedAt: timestamp('posted_at'),
    postedBy: uuid('posted_by').references(() => users.id),

    // Reversal Information
    isReversed: boolean('is_reversed').default(false).notNull(),
    reversedAt: timestamp('reversed_at'),
    reversedBy: uuid('reversed_by').references(() => users.id),
    reversalReason: text('reversal_reason'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    entryNumberCompanyIdx: unique().on(table.entryNumber, table.companyId),
    scheduleIdx: index().on(table.scheduleId),
    depreciationDateIdx: index().on(table.depreciationDate),
    isPostedIdx: index().on(table.isPosted),
    glEntryIdx: index().on(table.glEntryId),
  })
);

// Asset Revaluations
export const assetRevaluations = pgTable(
  'asset_revaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    revaluationNumber: varchar('revaluation_number', { length: 50 }).notNull(),

    // Revaluation Details
    revaluationDate: timestamp('revaluation_date').notNull(),
    revaluationMethod: varchar('revaluation_method', { length: 50 }).notNull(), // Fair Value, Replacement Cost, Market Value

    // Financial Information
    previousBookValue: decimal('previous_book_value', {
      precision: 15,
      scale: 2,
    }).notNull(),
    newFairValue: decimal('new_fair_value', {
      precision: 15,
      scale: 2,
    }).notNull(),
    revaluationSurplus: decimal('revaluation_surplus', {
      precision: 15,
      scale: 2,
    }).notNull(),

    // Valuation Details
    valuationBasis: text('valuation_basis'),
    valuedBy: varchar('valued_by', { length: 255 }), // Internal/External valuer
    valuationReport: jsonb('valuation_report'),

    // GL Account Mappings
    assetAccountId: uuid('asset_account_id').references(() => accounts.id),
    revaluationSurplusAccountId: uuid(
      'revaluation_surplus_account_id'
    ).references(() => accounts.id),

    // GL Integration
    glEntryId: uuid('gl_entry_id'),
    isPosted: boolean('is_posted').default(false).notNull(),
    postedAt: timestamp('posted_at'),
    postedBy: uuid('posted_by').references(() => users.id),

    // Approval Workflow
    status: varchar('status', { length: 50 }).default('Draft'), // Draft, Pending Approval, Approved, Posted
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Documentation
    documents: jsonb('documents'),
    notes: text('notes'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    revaluationNumberCompanyIdx: unique().on(
      table.revaluationNumber,
      table.companyId
    ),
    assetIdx: index().on(table.assetId),
    revaluationDateIdx: index().on(table.revaluationDate),
    statusIdx: index().on(table.status),
    isPostedIdx: index().on(table.isPosted),
  })
);

// Depreciation Methods Configuration
export const depreciationMethods = pgTable(
  'depreciation_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    methodCode: varchar('method_code', { length: 50 }).notNull(),
    methodName: varchar('method_name', { length: 255 }).notNull(),
    description: text('description'),

    // Method Configuration
    formula: text('formula'), // Mathematical formula for calculation
    parameters: jsonb('parameters'), // Method-specific parameters

    // Applicability
    isActive: boolean('is_active').default(true).notNull(),
    applicableAssetTypes: jsonb('applicable_asset_types'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    methodCodeCompanyIdx: unique().on(table.methodCode, table.companyId),
    isActiveIdx: index().on(table.isActive),
  })
);

// Relations
export const depreciationSchedulesRelations = relations(
  depreciationSchedules,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [depreciationSchedules.companyId],
      references: [companies.id],
    }),
    asset: one(assets, {
      fields: [depreciationSchedules.assetId],
      references: [assets.id],
    }),
    assetAccount: one(accounts, {
      fields: [depreciationSchedules.assetAccountId],
      references: [accounts.id],
    }),
    depreciationExpenseAccount: one(accounts, {
      fields: [depreciationSchedules.depreciationExpenseAccountId],
      references: [accounts.id],
    }),
    accumulatedDepreciationAccount: one(accounts, {
      fields: [depreciationSchedules.accumulatedDepreciationAccountId],
      references: [accounts.id],
    }),
    createdByUser: one(users, {
      fields: [depreciationSchedules.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [depreciationSchedules.updatedBy],
      references: [users.id],
    }),
    entries: many(depreciationEntries),
  })
);

export const depreciationEntriesRelations = relations(
  depreciationEntries,
  ({ one }) => ({
    company: one(companies, {
      fields: [depreciationEntries.companyId],
      references: [companies.id],
    }),
    schedule: one(depreciationSchedules, {
      fields: [depreciationEntries.scheduleId],
      references: [depreciationSchedules.id],
    }),
    postedByUser: one(users, {
      fields: [depreciationEntries.postedBy],
      references: [users.id],
    }),
    reversedByUser: one(users, {
      fields: [depreciationEntries.reversedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [depreciationEntries.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [depreciationEntries.updatedBy],
      references: [users.id],
    }),
  })
);

export const assetRevaluationsRelations = relations(
  assetRevaluations,
  ({ one }) => ({
    company: one(companies, {
      fields: [assetRevaluations.companyId],
      references: [companies.id],
    }),
    asset: one(assets, {
      fields: [assetRevaluations.assetId],
      references: [assets.id],
    }),
    assetAccount: one(accounts, {
      fields: [assetRevaluations.assetAccountId],
      references: [accounts.id],
    }),
    revaluationSurplusAccount: one(accounts, {
      fields: [assetRevaluations.revaluationSurplusAccountId],
      references: [accounts.id],
    }),
    postedByUser: one(users, {
      fields: [assetRevaluations.postedBy],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [assetRevaluations.approvedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [assetRevaluations.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [assetRevaluations.updatedBy],
      references: [users.id],
    }),
  })
);

export const depreciationMethodsRelations = relations(
  depreciationMethods,
  ({ one }) => ({
    company: one(companies, {
      fields: [depreciationMethods.companyId],
      references: [companies.id],
    }),
    createdByUser: one(users, {
      fields: [depreciationMethods.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [depreciationMethods.updatedBy],
      references: [users.id],
    }),
  })
);

// Export types
export type DepreciationSchedule = typeof depreciationSchedules.$inferSelect;
export type NewDepreciationSchedule = typeof depreciationSchedules.$inferInsert;
export type DepreciationEntry = typeof depreciationEntries.$inferSelect;
export type NewDepreciationEntry = typeof depreciationEntries.$inferInsert;
export type AssetRevaluation = typeof assetRevaluations.$inferSelect;
export type NewAssetRevaluation = typeof assetRevaluations.$inferInsert;
export type DepreciationMethod = typeof depreciationMethods.$inferSelect;
export type NewDepreciationMethod = typeof depreciationMethods.$inferInsert;
