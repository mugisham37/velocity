import { relations } from 'drizzle-orm';
import {
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
import { companies } from './companies';
import { users } from './users';

// Asset Master Table
export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetCode: varchar('asset_code', { length: 50 }).notNull(),
    assetName: varchar('asset_name', { length: 255 }).notNull(),
    assetCategoryId: uuid('asset_category_id').references(
      () => assetCategories.id
    ),

    // Asset Details
    description: text('description'),
    specifications: jsonb('specifications'),
    serialNumber: varchar('serial_number', { length: 100 }),
    modelNumber: varchar('model_number', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 255 }),
    supplier: varchar('supplier', { length: 255 }),

    // Financial Information
    purchaseDate: timestamp('purchase_date'),
    purchaseAmount: decimal('purchase_amount', { precision: 15, scale: 2 }),
    currentValue: decimal('current_value', { precision: 15, scale: 2 }),
    salvageValue: decimal('salvage_value', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Depreciation Settings
    depreciationMethod: varchar('depreciation_method', { length: 50 }).default(
      'Straight Line'
    ),
    usefulLife: integer('useful_life'), // in months
    depreciationStartDate: timestamp('depreciation_start_date'),

    // Location and Tracking
    currentLocationId: uuid('current_location_id').references(
      () => assetLocations.id
    ),
    custodianId: uuid('custodian_id').references(() => users.id),
    departmentId: uuid('department_id'),

    // Status and Lifecycle
    status: varchar('status', { length: 50 }).default('Active'), // Active, Inactive, Under Maintenance, Disposed
    condition: varchar('condition', { length: 50 }).default('Good'), // Excellent, Good, Fair, Poor

    // Barcode/RFID Integration
    barcode: varchar('barcode', { length: 100 }),
    rfidTag: varchar('rfid_tag', { length: 100 }),
    qrCode: varchar('qr_code', { length: 255 }),

    // Insurance and Warranty
    warrantyExpiryDate: timestamp('warranty_expiry_date'),
    insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }),
    insuranceExpiryDate: timestamp('insurance_expiry_date'),

    // Compliance and Documentation
    complianceCertifications: jsonb('compliance_certifications'),
    documents: jsonb('documents'),

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
    assetCodeCompanyIdx: unique().on(table.assetCode, table.companyId),
    serialNumberIdx: index().on(table.serialNumber),
    barcodeIdx: index().on(table.barcode),
    rfidTagIdx: index().on(table.rfidTag),
    statusIdx: index().on(table.status),
    categoryIdx: index().on(table.assetCategoryId),
    locationIdx: index().on(table.currentLocationId),
    custodianIdx: index().on(table.custodianId),
  })
);

// Asset Categories
export const assetCategories = pgTable(
  'asset_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryCode: varchar('category_code', { length: 50 }).notNull(),
    categoryName: varchar('category_name', { length: 255 }).notNull(),
    parentCategoryId: uuid('parent_category_id'),
    description: text('description'),

    // Default Settings for Assets in this Category
    defaultDepreciationMethod: varchar('default_depreciation_method', {
      length: 50,
    }),
    defaultUsefulLife: integer('default_useful_life'),
    defaultSalvageValuePercent: decimal('default_salvage_value_percent', {
      precision: 5,
      scale: 2,
    }),

    // GL Account Mappings
    assetAccountId: uuid('asset_account_id').references(() => accounts.id),
    depreciationAccountId: uuid('depreciation_account_id').references(
      () => accounts.id
    ),
    accumulatedDepreciationAccountId: uuid(
      'accumulated_depreciation_account_id'
    ).references(() => accounts.id),

    // Custom Attributes
    customAttributes: jsonb('custom_attributes'),

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
    categoryCodeCompanyIdx: unique().on(table.categoryCode, table.companyId),
    parentCategoryIdx: index().on(table.parentCategoryId),
  })
);

// Asset Locations
export const assetLocations = pgTable(
  'asset_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locationCode: varchar('location_code', { length: 50 }).notNull(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    parentLocationId: uuid('parent_location_id'),

    // Address Information
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),

    // GPS Coordinates
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Location Details
    description: text('description'),
    locationManagerId: uuid('location_manager_id').references(() => users.id),
    capacity: integer('capacity'),

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
    locationCodeCompanyIdx: unique().on(table.locationCode, table.companyId),
    parentLocationIdx: index().on(table.parentLocationId),
    managerIdx: index().on(table.locationManagerId),
  })
);

// Asset Transfers
export const assetTransfers = pgTable(
  'asset_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),

    // Transfer Details
    fromLocationId: uuid('from_location_id').references(
      () => assetLocations.id
    ),
    toLocationId: uuid('to_location_id')
      .references(() => assetLocations.id)
      .notNull(),
    fromCustodianId: uuid('from_custodian_id').references(() => users.id),
    toCustodianId: uuid('to_custodian_id').references(() => users.id),

    // Transfer Information
    transferDate: timestamp('transfer_date').notNull(),
    transferReason: varchar('transfer_reason', { length: 255 }),
    notes: text('notes'),

    // Approval Workflow
    status: varchar('status', { length: 50 }).default('Pending'), // Pending, Approved, In Transit, Completed, Cancelled
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    completedAt: timestamp('completed_at'),

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
    transferNumberCompanyIdx: unique().on(
      table.transferNumber,
      table.companyId
    ),
    assetIdx: index().on(table.assetId),
    statusIdx: index().on(table.status),
    transferDateIdx: index().on(table.transferDate),
  })
);

// Asset Disposal
export const assetDisposals = pgTable(
  'asset_disposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    disposalNumber: varchar('disposal_number', { length: 50 }).notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),

    // Disposal Details
    disposalDate: timestamp('disposal_date').notNull(),
    disposalMethod: varchar('disposal_method', { length: 50 }).notNull(), // Sale, Scrap, Donation, Trade-in
    disposalReason: varchar('disposal_reason', { length: 255 }),

    // Financial Information
    bookValue: decimal('book_value', { precision: 15, scale: 2 }).notNull(),
    disposalAmount: decimal('disposal_amount', {
      precision: 15,
      scale: 2,
    }).default('0'),
    gainLoss: decimal('gain_loss', { precision: 15, scale: 2 }),

    // Buyer/Recipient Information
    buyerName: varchar('buyer_name', { length: 255 }),
    buyerContact: varchar('buyer_contact', { length: 255 }),

    // Documentation
    documents: jsonb('documents'),
    notes: text('notes'),

    // Approval Workflow
    status: varchar('status', { length: 50 }).default('Pending'), // Pending, Approved, Completed
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

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
    disposalNumberCompanyIdx: unique().on(
      table.disposalNumber,
      table.companyId
    ),
    assetIdx: index().on(table.assetId),
    statusIdx: index().on(table.status),
    disposalDateIdx: index().on(table.disposalDate),
  })
);

// Relations
export const assetsRelations = relations(assets, ({ one, many }) => ({
  company: one(companies, {
    fields: [assets.companyId],
    references: [companies.id],
  }),
  category: one(assetCategories, {
    fields: [assets.assetCategoryId],
    references: [assetCategories.id],
  }),
  currentLocation: one(assetLocations, {
    fields: [assets.currentLocationId],
    references: [assetLocations.id],
  }),
  custodian: one(users, {
    fields: [assets.custodianId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [assets.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [assets.updatedBy],
    references: [users.id],
  }),
  transfers: many(assetTransfers),
  disposals: many(assetDisposals),
}));

export const assetCategoriesRelations = relations(
  assetCategories,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [assetCategories.companyId],
      references: [companies.id],
    }),
    parentCategory: one(assetCategories, {
      fields: [assetCategories.parentCategoryId],
      references: [assetCategories.id],
    }),
    childCategories: many(assetCategories),
    assets: many(assets),
    assetAccount: one(accounts, {
      fields: [assetCategories.assetAccountId],
      references: [accounts.id],
    }),
    depreciationAccount: one(accounts, {
      fields: [assetCategories.depreciationAccountId],
      references: [accounts.id],
    }),
    accumulatedDepreciationAccount: one(accounts, {
      fields: [assetCategories.accumulatedDepreciationAccountId],
      references: [accounts.id],
    }),
  })
);

export const assetLocationsRelations = relations(
  assetLocations,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [assetLocations.companyId],
      references: [companies.id],
    }),
    parentLocation: one(assetLocations, {
      fields: [assetLocations.parentLocationId],
      references: [assetLocations.id],
    }),
    childLocations: many(assetLocations),
    locationManager: one(users, {
      fields: [assetLocations.locationManagerId],
      references: [users.id],
    }),
    assets: many(assets),
    transfersFrom: many(assetTransfers, { relationName: 'fromLocation' }),
    transfersTo: many(assetTransfers, { relationName: 'toLocation' }),
  })
);

export const assetTransfersRelations = relations(assetTransfers, ({ one }) => ({
  company: one(companies, {
    fields: [assetTransfers.companyId],
    references: [companies.id],
  }),
  asset: one(assets, {
    fields: [assetTransfers.assetId],
    references: [assets.id],
  }),
  fromLocation: one(assetLocations, {
    fields: [assetTransfers.fromLocationId],
    references: [assetLocations.id],
    relationName: 'fromLocation',
  }),
  toLocation: one(assetLocations, {
    fields: [assetTransfers.toLocationId],
    references: [assetLocations.id],
    relationName: 'toLocation',
  }),
  fromCustodian: one(users, {
    fields: [assetTransfers.fromCustodianId],
    references: [users.id],
  }),
  toCustodian: one(users, {
    fields: [assetTransfers.toCustodianId],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [assetTransfers.approvedBy],
    references: [users.id],
  }),
}));

export const assetDisposalsRelations = relations(assetDisposals, ({ one }) => ({
  company: one(companies, {
    fields: [assetDisposals.companyId],
    references: [companies.id],
  }),
  asset: one(assets, {
    fields: [assetDisposals.assetId],
    references: [assets.id],
  }),
  approvedByUser: one(users, {
    fields: [assetDisposals.approvedBy],
    references: [users.id],
  }),
}));

// Export types
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetCategory = typeof assetCategories.$inferSelect;
export type NewAssetCategory = typeof assetCategories.$inferInsert;
export type AssetLocation = typeof assetLocations.$inferSelect;
export type NewAssetLocation = typeof assetLocations.$inferInsert;
export type AssetTransfer = typeof assetTransfers.$inferSelect;
export type NewAssetTransfer = typeof assetTransfers.$inferInsert;
export type AssetDisposal = typeof assetDisposals.$inferSelect;
export type NewAssetDisposal = typeof assetDisposals.$inferInsert;

