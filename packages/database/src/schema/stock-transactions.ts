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
import { companies } from './companies';
import { items } from './items';
import { users } from './users';
import { warehouseLocations, warehouses } from './warehouses';

// Stock Entries for all stock transactions
export const stockEntries = pgTable(
  'stock_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryNumber: varchar('entry_number', { length: 50 }).notNull(),
    entryType: varchar('entry_type', { length: 50 }).notNull(), // Receipt, Issue, Transfer, Adjustment, Opening, Closing

    // Reference Information
    referenceType: varchar('reference_type', { length: 50 }), // Purchase Receipt, Sales Invoice, Work Order, etc.
    referenceNumber: varchar('reference_number', { length: 50 }),
    referenceId: uuid('reference_id'), // ID of the reference document

    // Transaction Details
    transactionDate: timestamp('transaction_date').notNull(),
    postingDate: timestamp('posting_date').notNull(),

    // Warehouse Information
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    fromWarehouseId: uuid('from_warehouse_id').references(() => warehouses.id), // For transfers
    toWarehouseId: uuid('to_warehouse_id').references(() => warehouses.id), // For transfers

    // Status and Workflow
    status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, Submitted, Cancelled
    docStatus: varchar('doc_status', { length: 50 }).default('Draft').notNull(), // Draft, Submitted, Cancelled

    // Approval Workflow
    requiresApproval: boolean('requires_approval').default(false).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Cost Information
    totalValue: decimal('total_value', { precision: 15, scale: 2 }).default(
      '0'
    ),
    currency: varchar('currency', { length: 3 }).default('USD'),

    // Additional Information
    purpose: varchar('purpose', { length: 100 }), // Material Issue, Material Receipt, Stock Adjustment, etc.
    remarks: text('remarks'),

    // GL Integration
    isGlPosted: boolean('is_gl_posted').default(false).notNull(),
    glPostingDate: timestamp('gl_posting_date'),

    // Audit Fields
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    entryNumberIdx: unique('stock_entries_number_company_unique').on(
      table.entryNumber,
      table.companyId
    ),
    entryTypeIdx: index('stock_entries_type_idx').on(table.entryType),
    warehouseIdx: index('stock_entries_warehouse_idx').on(table.warehouseId),
    statusIdx: index('stock_entries_status_idx').on(table.status),
    dateIdx: index('stock_entries_date_idx').on(table.transactionDate),
    referenceIdx: index('stock_entries_reference_idx').on(
      table.referenceType,
      table.referenceNumber
    ),
    companyIdx: index('stock_entries_company_idx').on(table.companyId),
  })
);

export const stockEntriesRelations = relations(
  stockEntries,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [stockEntries.companyId],
      references: [companies.id],
    }),
    warehouse: one(warehouses, {
      fields: [stockEntries.warehouseId],
      references: [warehouses.id],
    }),
    fromWarehouse: one(warehouses, {
      fields: [stockEntries.fromWarehouseId],
      references: [warehouses.id],
    }),
    toWarehouse: one(warehouses, {
      fields: [stockEntries.toWarehouseId],
      references: [warehouses.id],
    }),
    creator: one(users, {
      fields: [stockEntries.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [stockEntries.updatedBy],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [stockEntries.approvedBy],
      references: [users.id],
    }),
    stockEntryItems: many(stockEntryItems),
  })
);

// Stock Entry Items for detailed item-level transaction information
export const stockEntryItems = pgTable(
  'stock_entry_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stockEntryId: uuid('stock_entry_id')
      .references(() => stockEntries.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),

    // Location Information
    locationId: uuid('location_id').references(() => warehouseLocations.id),
    fromLocationId: uuid('from_location_id').references(
      () => warehouseLocations.id
    ), // For transfers
    toLocationId: uuid('to_location_id').references(
      () => warehouseLocations.id
    ), // For transfers

    // Quantity Information
    qty: decimal('qty', { precision: 15, scale: 2 }).notNull(),
    uom: varchar('uom', { length: 20 }).notNull(),
    conversionFactor: decimal('conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),
    stockUomQty: decimal('stock_uom_qty', {
      precision: 15,
      scale: 2,
    }).notNull(), // Quantity in stock UOM

    // Serial/Batch Tracking
    serialNumbers: jsonb('serial_numbers'), // Array of serial numbers
    batchNumbers: jsonb('batch_numbers'), // Array of batch numbers with quantities
    hasSerialNo: boolean('has_serial_no').default(false).notNull(),
    hasBatchNo: boolean('has_batch_no').default(false).notNull(),

    // Valuation Information
    valuationRate: decimal('valuation_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    amount: decimal('amount', { precision: 15, scale: 2 }).default('0'),

    // Quality Information
    qualityInspection: varchar('quality_inspection', { length: 100 }),
    inspectionRequired: boolean('inspection_required').default(false).notNull(),
    qualityStatus: varchar('quality_status', { length: 50 }).default(
      'Accepted'
    ), // Accepted, Rejected, Pending

    // Additional Information
    remarks: text('remarks'),

    // Stock Levels Before Transaction (for audit trail)
    actualQtyBefore: decimal('actual_qty_before', {
      precision: 15,
      scale: 2,
    }).default('0'),
    actualQtyAfter: decimal('actual_qty_after', {
      precision: 15,
      scale: 2,
    }).default('0'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    stockEntryIdx: index('stock_entry_items_entry_idx').on(table.stockEntryId),
    itemIdx: index('stock_entry_items_item_idx').on(table.itemId),
    locationIdx: index('stock_entry_items_location_idx').on(table.locationId),
    batchIdx: index('stock_entry_items_batch_idx').on(table.batchNumbers),
  })
);

export const stockEntryItemsRelations = relations(
  stockEntryItems,
  ({ one }) => ({
    stockEntry: one(stockEntries, {
      fields: [stockEntryItems.stockEntryId],
      references: [stockEntries.id],
    }),
    item: one(items, {
      fields: [stockEntryItems.itemId],
      references: [items.id],
    }),
    location: one(warehouseLocations, {
      fields: [stockEntryItems.locationId],
      references: [warehouseLocations.id],
    }),
    fromLocation: one(warehouseLocations, {
      fields: [stockEntryItems.fromLocationId],
      references: [warehouseLocations.id],
    }),
    toLocation: one(warehouseLocations, {
      fields: [stockEntryItems.toLocationId],
      references: [warehouseLocations.id],
    }),
  })
);

// Stock Ledger for maintaining stock movement history
export const stockLedgerEntries = pgTable(
  'stock_ledger_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Item and Location
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Transaction Reference
    voucherType: varchar('voucher_type', { length: 50 }).notNull(), // Stock Entry, Sales Invoice, Purchase Receipt, etc.
    voucherNumber: varchar('voucher_number', { length: 50 }).notNull(),
    voucherId: uuid('voucher_id').notNull(),

    // Transaction Details
    postingDate: timestamp('posting_date').notNull(),
    postingTime: timestamp('posting_time').notNull(),

    // Quantity Information
    actualQty: decimal('actual_qty', { precision: 15, scale: 2 }).default('0'),
    qtyAfterTransaction: decimal('qty_after_transaction', {
      precision: 15,
      scale: 2,
    }).default('0'),
    incomingRate: decimal('incoming_rate', { precision: 15, scale: 2 }).default(
      '0'
    ),
    valuationRate: decimal('valuation_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    stockValue: decimal('stock_value', { precision: 15, scale: 2 }).default(
      '0'
    ),
    stockValueDifference: decimal('stock_value_difference', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Serial/Batch Information
    serialNo: varchar('serial_no', { length: 100 }),
    batchNo: varchar('batch_no', { length: 100 }),

    // Reservation Information
    reservedQty: decimal('reserved_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    reservedStock: decimal('reserved_stock', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Additional Information
    projectId: uuid('project_id'), // For project-based inventory

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    itemWarehouseIdx: index('stock_ledger_item_warehouse_idx').on(
      table.itemId,
      table.warehouseId
    ),
    voucherIdx: index('stock_ledger_voucher_idx').on(
      table.voucherType,
      table.voucherNumber
    ),
    postingDateIdx: index('stock_ledger_posting_date_idx').on(
      table.postingDate
    ),
    serialIdx: index('stock_ledger_serial_idx').on(table.serialNo),
    batchIdx: index('stock_ledger_batch_idx').on(table.batchNo),
    companyIdx: index('stock_ledger_company_idx').on(table.companyId),
  })
);

export const stockLedgerEntriesRelations = relations(
  stockLedgerEntries,
  ({ one }) => ({
    item: one(items, {
      fields: [stockLedgerEntries.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [stockLedgerEntries.warehouseId],
      references: [warehouses.id],
    }),
    location: one(warehouseLocations, {
      fields: [stockLedgerEntries.locationId],
      references: [warehouseLocations.id],
    }),
    company: one(companies, {
      fields: [stockLedgerEntries.companyId],
      references: [companies.id],
    }),
  })
);

// Stock Reservations for sales orders and production
export const stockReservations = pgTable(
  'stock_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Item and Location
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Reservation Details
    reservationType: varchar('reservation_type', { length: 50 }).notNull(), // Sales Order, Work Order, Quality Inspection
    referenceType: varchar('reference_type', { length: 50 }).notNull(),
    referenceNumber: varchar('reference_number', { length: 50 }).notNull(),
    referenceId: uuid('reference_id').notNull(),

    // Quantity Information
    reservedQty: decimal('reserved_qty', { precision: 15, scale: 2 }).notNull(),
    deliveredQty: decimal('delivered_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    uom: varchar('uom', { length: 20 }).notNull(),

    // Serial/Batch Information
    serialNumbers: jsonb('serial_numbers'), // Array of reserved serial numbers
    batchNumbers: jsonb('batch_numbers'), // Array of reserved batch numbers with quantities

    // Dates
    reservationDate: timestamp('reservation_date').notNull(),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    expiryDate: timestamp('expiry_date'), // Auto-release reservation after this date

    // Status
    status: varchar('status', { length: 50 }).default('Active').notNull(), // Active, Delivered, Cancelled, Expired

    // Priority
    priority: integer('priority').default(1).notNull(), // 1 = Highest, 10 = Lowest

    // Additional Information
    remarks: text('remarks'),

    // Audit Fields
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemWarehouseIdx: index('stock_reservations_item_warehouse_idx').on(
      table.itemId,
      table.warehouseId
    ),
    referenceIdx: index('stock_reservations_reference_idx').on(
      table.referenceType,
      table.referenceNumber
    ),
    statusIdx: index('stock_reservations_status_idx').on(table.status),
    expiryIdx: index('stock_reservations_expiry_idx').on(table.expiryDate),
    companyIdx: index('stock_reservations_company_idx').on(table.companyId),
  })
);

export const stockReservationsRelations = relations(
  stockReservations,
  ({ one }) => ({
    item: one(items, {
      fields: [stockReservations.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [stockReservations.warehouseId],
      references: [warehouses.id],
    }),
    location: one(warehouseLocations, {
      fields: [stockReservations.locationId],
      references: [warehouseLocations.id],
    }),
    creator: one(users, {
      fields: [stockReservations.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [stockReservations.updatedBy],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [stockReservations.companyId],
      references: [companies.id],
    }),
  })
);

// Stock Reconciliation for periodic stock verification
export const stockReconciliations = pgTable(
  'stock_reconciliations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reconciliationNumber: varchar('reconciliation_number', {
      length: 50,
    }).notNull(),

    // Reconciliation Details
    reconciliationDate: timestamp('reconciliation_date').notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),

    // Status
    status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, In Progress, Completed, Cancelled

    // Reconciliation Type
    reconciliationType: varchar('reconciliation_type', {
      length: 50,
    }).notNull(), // Full, Partial, Cycle Count

    // Results Summary
    totalItemsCount: integer('total_items_count').default(0),
    itemsWithVariance: integer('items_with_variance').default(0),
    totalVarianceValue: decimal('total_variance_value', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Additional Information
    purpose: varchar('purpose', { length: 100 }),
    remarks: text('remarks'),

    // Approval Workflow
    requiresApproval: boolean('requires_approval').default(true).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Audit Fields
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    reconciliationNumberIdx: unique(
      'stock_reconciliations_number_company_unique'
    ).on(table.reconciliationNumber, table.companyId),
    warehouseIdx: index('stock_reconciliations_warehouse_idx').on(
      table.warehouseId
    ),
    statusIdx: index('stock_reconciliations_status_idx').on(table.status),
    dateIdx: index('stock_reconciliations_date_idx').on(
      table.reconciliationDate
    ),
    companyIdx: index('stock_reconciliations_company_idx').on(table.companyId),
  })
);

export const stockReconciliationsRelations = relations(
  stockReconciliations,
  ({ one, many }) => ({
    warehouse: one(warehouses, {
      fields: [stockReconciliations.warehouseId],
      references: [warehouses.id],
    }),
    creator: one(users, {
      fields: [stockReconciliations.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [stockReconciliations.updatedBy],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [stockReconciliations.approvedBy],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [stockReconciliations.companyId],
      references: [companies.id],
    }),
    reconciliationItems: many(stockReconciliationItems),
  })
);

// Stock Reconciliation Items for detailed item-level reconciliation
export const stockReconciliationItems = pgTable(
  'stock_reconciliation_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reconciliationId: uuid('reconciliation_id')
      .references(() => stockReconciliations.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Quantity Information
    systemQty: decimal('system_qty', { precision: 15, scale: 2 }).default('0'), // Quantity per system
    physicalQty: decimal('physical_qty', { precision: 15, scale: 2 }).default(
      '0'
    ), // Actual counted quantity
    varianceQty: decimal('variance_qty', { precision: 15, scale: 2 }).default(
      '0'
    ), // Difference

    // Valuation Information
    valuationRate: decimal('valuation_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    varianceValue: decimal('variance_value', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Serial/Batch Information
    serialNumbers: jsonb('serial_numbers'), // Array of counted serial numbers
    batchNumbers: jsonb('batch_numbers'), // Array of counted batch numbers with quantities

    // Reconciliation Status
    isReconciled: boolean('is_reconciled').default(false).notNull(),
    varianceReason: varchar('variance_reason', { length: 100 }), // Damaged, Stolen, Expired, Count Error, etc.

    // Additional Information
    remarks: text('remarks'),
    countedBy: uuid('counted_by').references(() => users.id),
    countedAt: timestamp('counted_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    reconciliationIdx: index(
      'stock_reconciliation_items_reconciliation_idx'
    ).on(table.reconciliationId),
    itemIdx: index('stock_reconciliation_items_item_idx').on(table.itemId),
    locationIdx: index('stock_reconciliation_items_location_idx').on(
      table.locationId
    ),
    varianceIdx: index('stock_reconciliation_items_variance_idx').on(
      table.varianceQty
    ),
  })
);

export const stockReconciliationItemsRelations = relations(
  stockReconciliationItems,
  ({ one }) => ({
    reconciliation: one(stockReconciliations, {
      fields: [stockReconciliationItems.reconciliationId],
      references: [stockReconciliations.id],
    }),
    item: one(items, {
      fields: [stockReconciliationItems.itemId],
      references: [items.id],
    }),
    location: one(warehouseLocations, {
      fields: [stockReconciliationItems.locationId],
      references: [warehouseLocations.id],
    }),
    counter: one(users, {
      fields: [stockReconciliationItems.countedBy],
      references: [users.id],
    }),
  })
);
