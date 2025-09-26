import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { customers } from './customers';
import { items } from './items';
import { users } from './users';
import { vendors } from './vendors';
import { warehouseLocations, warehouses } from './warehouses';

// Serial Numbers table for individual item tracking
export const serialNumbers = pgTable(
  'serial_numbers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Status and Condition
    status: varchar('status', { length: 50 }).default('Available').notNull(), // Available, Reserved, Sold, Damaged, Lost, Returned
    condition: varchar('condition', { length: 50 }).default('Good').notNull(), // Good, Damaged, Refurbished, New

    // Purchase Information
    purchaseDate: timestamp('purchase_date'),
    purchaseRate: decimal('purchase_rate', { precision: 15, scale: 2 }).default(
      '0'
    ),
    supplierId: uuid('supplier_id').references(() => vendors.id),
    purchaseDocumentType: varchar('purchase_document_type', { length: 50 }),
    purchaseDocumentNumber: varchar('purchase_document_number', {
      length: 50,
    }),

    // Warranty and Maintenance
    warrantyExpiryDate: timestamp('warranty_expiry_date'),
    maintenanceDueDate: timestamp('maintenance_due_date'),
    lastMaintenanceDate: timestamp('last_maintenance_date'),

    // Delivery Information
    deliveryDate: timestamp('delivery_date'),
    deliveryDocumentType: varchar('delivery_document_type', { length: 50 }),
    deliveryDocumentNumber: varchar('delivery_document_number', {
      length: 50,
    }),
    customerId: uuid('customer_id').references(() => customers.id),

    // Additional Information
    notes: text('notes'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    serialNumberIdx: unique('serial_numbers_unique').on(
      table.serialNumber,
      table.companyId
    ),
    itemIdx: index('serial_numbers_item_idx').on(table.itemId),
    warehouseIdx: index('serial_numbers_warehouse_idx').on(table.warehouseId),
    locationIdx: index('serial_numbers_location_idx').on(table.locationId),
    statusIdx: index('serial_numbers_status_idx').on(table.status),
    conditionIdx: index('serial_numbers_condition_idx').on(table.condition),
    customerIdx: index('serial_numbers_customer_idx').on(table.customerId),
    supplierIdx: index('serial_numbers_supplier_idx').on(table.supplierId),
    warrantyIdx: index('serial_numbers_warranty_idx').on(
      table.warrantyExpiryDate
    ),
    companyIdx: index('serial_numbers_company_idx').on(table.companyId),
  })
);

export const serialNumbersRelations = relations(
  serialNumbers,
  ({ one, many }) => ({
    item: one(items, {
      fields: [serialNumbers.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [serialNumbers.warehouseId],
      references: [warehouses.id],
    }),
    location: one(warehouseLocations, {
      fields: [serialNumbers.locationId],
      references: [warehouseLocations.id],
    }),
    supplier: one(vendors, {
      fields: [serialNumbers.supplierId],
      references: [vendors.id],
    }),
    customer: one(customers, {
      fields: [serialNumbers.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [serialNumbers.companyId],
      references: [companies.id],
    }),
    history: many(serialNumberHistory),
    qualityInspections: many(qualityInspections),
    recallItems: many(recallItems),
  })
);

// Batch Numbers table for lot tracking
export const batchNumbers = pgTable(
  'batch_numbers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),

    // Manufacturing Information
    manufacturingDate: timestamp('manufacturing_date'),
    expiryDate: timestamp('expiry_date'),
    supplierBatchId: varchar('supplier_batch_id', { length: 100 }),
    supplierId: uuid('supplier_id').references(() => vendors.id),
    purchaseDocumentType: varchar('purchase_document_type', { length: 50 }),
    purchaseDocumentNumber: varchar('purchase_document_number', {
      length: 50,
    }),
    manufacturingLocation: varchar('manufacturing_location', { length: 255 }),

    // Quality Information
    qualityStatus: varchar('quality_status', { length: 50 })
      .default('Approved')
      .notNull(), // Approved, Rejected, Pending, Quarantine
    qualityInspectionDate: timestamp('quality_inspection_date'),
    qualityInspector: uuid('quality_inspector').references(() => users.id),
    qualityNotes: text('quality_notes'),

    // Quantity Information
    totalQty: decimal('total_qty', { precision: 15, scale: 2 })
      .default('0')
      .notNull(),
    availableQty: decimal('available_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    reservedQty: decimal('reserved_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    consumedQty: decimal('consumed_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    uom: varchar('uom', { length: 20 }).notNull(),

    // Custom Attributes (temperature, pH, etc.)
    batchAttributes: jsonb('batch_attributes'),

    // Status
    isActive: boolean('is_active').default(true).notNull(),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    batchNumberIdx: unique('batch_numbers_unique').on(
      table.batchNumber,
      table.itemId,
      table.companyId
    ),
    itemIdx: index('batch_numbers_item_idx').on(table.itemId),
    expiryIdx: index('batch_numbers_expiry_idx').on(table.expiryDate),
    manufacturingIdx: index('batch_numbers_manufacturing_idx').on(
      table.manufacturingDate
    ),
    qualityStatusIdx: index('batch_numbers_quality_status_idx').on(
      table.qualityStatus
    ),
    supplierIdx: index('batch_numbers_supplier_idx').on(table.supplierId),
    activeIdx: index('batch_numbers_active_idx').on(table.isActive),
    companyIdx: index('batch_numbers_company_idx').on(table.companyId),
  })
);

export const batchNumbersRelations = relations(
  batchNumbers,
  ({ one, many }) => ({
    item: one(items, {
      fields: [batchNumbers.itemId],
      references: [items.id],
    }),
    supplier: one(vendors, {
      fields: [batchNumbers.supplierId],
      references: [vendors.id],
    }),
    inspector: one(users, {
      fields: [batchNumbers.qualityInspector],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [batchNumbers.companyId],
      references: [companies.id],
    }),
    locations: many(batchLocations),
    history: many(batchHistory),
    qualityInspections: many(qualityInspections),
    recallItems: many(recallItems),
  })
);

// Batch Locations table for tracking batch quantities across locations
export const batchLocations = pgTable(
  'batch_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .references(() => batchNumbers.id, { onDelete: 'cascade' })
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Quantity Information
    qty: decimal('qty', { precision: 15, scale: 2 }).default('0').notNull(),
    reservedQty: decimal('reserved_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Last Transaction
    lastTransactionDate: timestamp('last_transaction_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    batchLocationIdx: unique('batch_locations_unique').on(
      table.batchId,
      table.warehouseId,
      table.locationId
    ),
    batchIdx: index('batch_locations_batch_idx').on(table.batchId),
    warehouseIdx: index('batch_locations_warehouse_idx').on(table.warehouseId),
    locationIdx: index('batch_locations_location_idx').on(table.locationId),
  })
);

export const batchLocationsRelations = relations(batchLocations, ({ one }) => ({
  batch: one(batchNumbers, {
    fields: [batchLocations.batchId],
    references: [batchNumbers.id],
  }),
  warehouse: one(warehouses, {
    fields: [batchLocations.warehouseId],
    references: [warehouses.id],
  }),
  location: one(warehouseLocations, {
    fields: [batchLocations.locationId],
    references: [warehouseLocations.id],
  }),
}));

// Serial Number History for complete traceability
export const serialNumberHistory = pgTable(
  'serial_number_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serialNumberId: uuid('serial_number_id')
      .references(() => serialNumbers.id, { onDelete: 'cascade' })
      .notNull(),

    // Transaction Information
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // Purchase, Sale, Transfer, Maintenance, Return, Damage
    transactionDate: timestamp('transaction_date').notNull(),

    // Location Changes
    fromWarehouseId: uuid('from_warehouse_id').references(() => warehouses.id),
    toWarehouseId: uuid('to_warehouse_id').references(() => warehouses.id),
    fromLocationId: uuid('from_location_id').references(
      () => warehouseLocations.id
    ),
    toLocationId: uuid('to_location_id').references(
      () => warehouseLocations.id
    ),

    // Customer Changes
    fromCustomerId: uuid('from_customer_id').references(() => customers.id),
    toCustomerId: uuid('to_customer_id').references(() => customers.id),

    // Document Reference
    documentType: varchar('document_type', { length: 50 }),
    documentNumber: varchar('document_number', { length: 50 }),
    documentId: uuid('document_id'),

    // Status Changes
    previousStatus: varchar('previous_status', { length: 50 }),
    newStatus: varchar('new_status', { length: 50 }),
    previousCondition: varchar('previous_condition', { length: 50 }),
    newCondition: varchar('new_condition', { length: 50 }),

    // Additional Information
    notes: text('notes'),

    // Audit Fields
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    serialIdx: index('serial_number_history_serial_idx').on(
      table.serialNumberId
    ),
    transactionIdx: index('serial_number_history_transaction_idx').on(
      table.transactionType
    ),
    dateIdx: index('serial_number_history_date_idx').on(table.transactionDate),
    documentIdx: index('serial_number_history_document_idx').on(
      table.documentType,
      table.documentNumber
    ),
    companyIdx: index('serial_number_history_company_idx').on(table.companyId),
  })
);

export const serialNumberHistoryRelations = relations(
  serialNumberHistory,
  ({ one }) => ({
    serialNumber: one(serialNumbers, {
      fields: [serialNumberHistory.serialNumberId],
      references: [serialNumbers.id],
    }),
    fromWarehouse: one(warehouses, {
      fields: [serialNumberHistory.fromWarehouseId],
      references: [warehouses.id],
    }),
    toWarehouse: one(warehouses, {
      fields: [serialNumberHistory.toWarehouseId],
      references: [warehouses.id],
    }),
    fromLocation: one(warehouseLocations, {
      fields: [serialNumberHistory.fromLocationId],
      references: [warehouseLocations.id],
    }),
    toLocation: one(warehouseLocations, {
      fields: [serialNumberHistory.toLocationId],
      references: [warehouseLocations.id],
    }),
    fromCustomer: one(customers, {
      fields: [serialNumberHistory.fromCustomerId],
      references: [customers.id],
    }),
    toCustomer: one(customers, {
      fields: [serialNumberHistory.toCustomerId],
      references: [customers.id],
    }),
    creator: one(users, {
      fields: [serialNumberHistory.createdBy],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [serialNumberHistory.companyId],
      references: [companies.id],
    }),
  })
);

// Batch History for lot traceability
export const batchHistory = pgTable(
  'batch_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .references(() => batchNumbers.id, { onDelete: 'cascade' })
      .notNull(),

    // Transaction Information
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // Receipt, Issue, Transfer, Adjustment, Expiry, Quality
    transactionDate: timestamp('transaction_date').notNull(),

    // Location Information
    warehouseId: uuid('warehouse_id').references(() => warehouses.id),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Quantity Changes
    qtyChange: decimal('qty_change', { precision: 15, scale: 2 })
      .default('0')
      .notNull(),
    qtyBefore: decimal('qty_before', { precision: 15, scale: 2 }).default('0'),
    qtyAfter: decimal('qty_after', { precision: 15, scale: 2 }).default('0'),

    // Document Reference
    documentType: varchar('document_type', { length: 50 }),
    documentNumber: varchar('document_number', { length: 50 }),
    documentId: uuid('document_id'),

    // Additional Information
    reason: varchar('reason', { length: 100 }),
    notes: text('notes'),

    // Audit Fields
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    batchIdx: index('batch_history_batch_idx').on(table.batchId),
    transactionIdx: index('batch_history_transaction_idx').on(
      table.transactionType
    ),
    dateIdx: index('batch_history_date_idx').on(table.transactionDate),
    warehouseIdx: index('batch_history_warehouse_idx').on(table.warehouseId),
    documentIdx: index('batch_history_document_idx').on(
      table.documentType,
      table.documentNumber
    ),
    companyIdx: index('batch_history_company_idx').on(table.companyId),
  })
);

export const batchHistoryRelations = relations(batchHistory, ({ one }) => ({
  batch: one(batchNumbers, {
    fields: [batchHistory.batchId],
    references: [batchNumbers.id],
  }),
  warehouse: one(warehouses, {
    fields: [batchHistory.warehouseId],
    references: [warehouses.id],
  }),
  location: one(warehouseLocations, {
    fields: [batchHistory.locationId],
    references: [warehouseLocations.id],
  }),
  creator: one(users, {
    fields: [batchHistory.createdBy],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [batchHistory.companyId],
    references: [companies.id],
  }),
}));

// Product Recalls for tracking product recalls
export const productRecalls = pgTable(
  'product_recalls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recallNumber: varchar('recall_number', { length: 50 }).notNull(),
    recallTitle: varchar('recall_title', { length: 255 }).notNull(),

    // Recall Information
    recallType: varchar('recall_type', { length: 50 }).notNull(), // Voluntary, Mandatory, Precautionary
    severityLevel: varchar('severity_level', { length: 50 }).notNull(), // Critical, High, Medium, Low
    recallReason: text('recall_reason').notNull(),

    // Dates
    recallDate: timestamp('recall_date').notNull(),
    effectiveDate: timestamp('effective_date').notNull(),
    expiryDate: timestamp('expiry_date'),

    // Status
    status: varchar('status', { length: 50 }).default('Active').notNull(), // Active, Completed, Cancelled

    // Regulatory Information
    regulatoryBody: varchar('regulatory_body', { length: 255 }),
    regulatoryReference: varchar('regulatory_reference', { length: 100 }),

    // Affected Items
    affectedItems: jsonb('affected_items').notNull(), // Array of item IDs
    affectedBatches: jsonb('affected_batches'), // Array of batch numbers/patterns
    affectedSerials: jsonb('affected_serials'), // Array of serial number patterns
    dateRangeFrom: timestamp('date_range_from'),
    dateRangeTo: timestamp('date_range_to'),

    // Notification Requirements
    customerNotificationRequired: boolean('customer_notification_required')
      .default(true)
      .notNull(),
    supplierNotificationRequired: boolean('supplier_notification_required')
      .default(false)
      .notNull(),

    // Instructions and Contact
    recallInstructions: text('recall_instructions'),
    contactInformation: jsonb('contact_information'),

    // Recovery Statistics
    totalAffectedQty: decimal('total_affected_qty', {
      precision: 15,
      scale: 2,
    }).default('0'),
    recoveredQty: decimal('recovered_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    destroyedQty: decimal('destroyed_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    returnedQty: decimal('returned_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),

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
    recallNumberIdx: unique('product_recalls_number_company_unique').on(
      table.recallNumber,
      table.companyId
    ),
    typeIdx: index('product_recalls_type_idx').on(table.recallType),
    severityIdx: index('product_recalls_severity_idx').on(table.severityLevel),
    statusIdx: index('product_recalls_status_idx').on(table.status),
    dateIdx: index('product_recalls_date_idx').on(table.recallDate),
    effectiveIdx: index('product_recalls_effective_idx').on(
      table.effectiveDate
    ),
    companyIdx: index('product_recalls_company_idx').on(table.companyId),
  })
);

export const productRecallsRelations = relations(
  productRecalls,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [productRecalls.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [productRecalls.updatedBy],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [productRecalls.companyId],
      references: [companies.id],
    }),
    recallItems: many(recallItems),
  })
);

// Recall Items for tracking specific affected items
export const recallItems = pgTable(
  'recall_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recallId: uuid('recall_id')
      .references(() => productRecalls.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    batchId: uuid('batch_id').references(() => batchNumbers.id),
    serialNumberId: uuid('serial_number_id').references(() => serialNumbers.id),

    // Location Information
    customerId: uuid('customer_id').references(() => customers.id),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Quantity Information
    qtyAffected: decimal('qty_affected', { precision: 15, scale: 2 }).default(
      '0'
    ),
    qtyRecovered: decimal('qty_recovered', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Recovery Status
    recoveryStatus: varchar('recovery_status', { length: 50 })
      .default('Pending')
      .notNull(), // Pending, Recovered, Destroyed, Customer_Notified
    recoveryDate: timestamp('recovery_date'),
    recoveryMethod: varchar('recovery_method', { length: 50 }), // Return, Destroy, Repair, Exchange

    // Customer Notification
    customerNotified: boolean('customer_notified').default(false).notNull(),
    notificationDate: timestamp('notification_date'),
    notificationMethod: varchar('notification_method', { length: 50 }), // Email, Phone, Letter, SMS

    // Additional Information
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    recallIdx: index('recall_items_recall_idx').on(table.recallId),
    itemIdx: index('recall_items_item_idx').on(table.itemId),
    batchIdx: index('recall_items_batch_idx').on(table.batchId),
    serialIdx: index('recall_items_serial_idx').on(table.serialNumberId),
    customerIdx: index('recall_items_customer_idx').on(table.customerId),
    statusIdx: index('recall_items_status_idx').on(table.recoveryStatus),
  })
);

export const recallItemsRelations = relations(recallItems, ({ one }) => ({
  recall: one(productRecalls, {
    fields: [recallItems.recallId],
    references: [productRecalls.id],
  }),
  item: one(items, {
    fields: [recallItems.itemId],
    references: [items.id],
  }),
  batch: one(batchNumbers, {
    fields: [recallItems.batchId],
    references: [batchNumbers.id],
  }),
  serialNumber: one(serialNumbers, {
    fields: [recallItems.serialNumberId],
    references: [serialNumbers.id],
  }),
  customer: one(customers, {
    fields: [recallItems.customerId],
    references: [customers.id],
  }),
  warehouse: one(warehouses, {
    fields: [recallItems.warehouseId],
    references: [warehouses.id],
  }),
  location: one(warehouseLocations, {
    fields: [recallItems.locationId],
    references: [warehouseLocations.id],
  }),
}));

// Quality Control Integration
export const qualityInspections = pgTable(
  'quality_inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inspectionNumber: varchar('inspection_number', { length: 50 }).notNull(),
    inspectionType: varchar('inspection_type', { length: 50 }).notNull(), // Incoming, In-Process, Final, Random

    // Item Information
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),
    batchId: uuid('batch_id').references(() => batchNumbers.id),
    serialNumberId: uuid('serial_number_id').references(() => serialNumbers.id),

    // Inspection Details
    inspectionDate: timestamp('inspection_date').notNull(),
    inspectorId: uuid('inspector_id')
      .references(() => users.id)
      .notNull(),
    inspectionTemplate: varchar('inspection_template', { length: 100 }),

    // Sample Information
    sampleSize: decimal('sample_size', { precision: 15, scale: 2 }),
    totalQtyInspected: decimal('total_qty_inspected', {
      precision: 15,
      scale: 2,
    }),
    passedQty: decimal('passed_qty', { precision: 15, scale: 2 }).default('0'),
    failedQty: decimal('failed_qty', { precision: 15, scale: 2 }).default('0'),

    // Results
    overallStatus: varchar('overall_status', { length: 50 })
      .default('Pending')
      .notNull(), // Pending, Passed, Failed, Conditional
    inspectionResults: jsonb('inspection_results'), // Detailed test results
    defectsFound: jsonb('defects_found'), // Array of defect types and quantities
    correctiveActions: text('corrective_actions'),
    inspectorNotes: text('inspector_notes'),

    // Approval
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Location Information
    warehouseId: uuid('warehouse_id').references(() => warehouses.id),
    locationId: uuid('location_id').references(() => warehouseLocations.id),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    inspectionNumberIdx: unique('quality_inspections_number_company_unique').on(
      table.inspectionNumber,
      table.companyId
    ),
    itemIdx: index('quality_inspections_item_idx').on(table.itemId),
    batchIdx: index('quality_inspections_batch_idx').on(table.batchId),
    serialIdx: index('quality_inspections_serial_idx').on(table.serialNumberId),
    typeIdx: index('quality_inspections_type_idx').on(table.inspectionType),
    statusIdx: index('quality_inspections_status_idx').on(table.overallStatus),
    dateIdx: index('quality_inspections_date_idx').on(table.inspectionDate),
    inspectorIdx: index('quality_inspections_inspector_idx').on(
      table.inspectorId
    ),
    companyIdx: index('quality_inspections_company_idx').on(table.companyId),
  })
);

export const qualityInspectionsRelations = relations(
  qualityInspections,
  ({ one }) => ({
    item: one(items, {
      fields: [qualityInspections.itemId],
      references: [items.id],
    }),
    batch: one(batchNumbers, {
      fields: [qualityInspections.batchId],
      references: [batchNumbers.id],
    }),
    serialNumber: one(serialNumbers, {
      fields: [qualityInspections.serialNumberId],
      references: [serialNumbers.id],
    }),
    inspector: one(users, {
      fields: [qualityInspections.inspectorId],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [qualityInspections.approvedBy],
      references: [users.id],
    }),
    warehouse: one(warehouses, {
      fields: [qualityInspections.warehouseId],
      references: [warehouses.id],
    }),
    location: one(warehouseLocations, {
      fields: [qualityInspections.locationId],
      references: [warehouseLocations.id],
    }),
    company: one(companies, {
      fields: [qualityInspections.companyId],
      references: [companies.id],
    }),
  })
);

// Compliance Reporting for regulated industries
export const complianceReports = pgTable(
  'compliance_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportNumber: varchar('report_number', { length: 50 }).notNull(),
    reportType: varchar('report_type', { length: 50 }).notNull(), // FDA, EU_MDR, ISO, Custom
    reportTitle: varchar('report_title', { length: 255 }).notNull(),

    // Reporting Period
    reportingPeriodFrom: timestamp('reporting_period_from').notNull(),
    reportingPeriodTo: timestamp('reporting_period_to').notNull(),

    // Regulatory Information
    regulatoryBody: varchar('regulatory_body', { length: 255 }),
    regulationReference: varchar('regulation_reference', { length: 100 }),

    // Report Data
    reportData: jsonb('report_data').notNull(), // Structured report data
    affectedItems: jsonb('affected_items'), // Array of item IDs
    affectedBatches: jsonb('affected_batches'), // Array of batch IDs
    affectedSerials: jsonb('affected_serials'), // Array of serial number IDs

    // Status and Submission
    status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, Submitted, Approved, Rejected
    submissionDate: timestamp('submission_date'),
    submissionReference: varchar('submission_reference', { length: 100 }),
    responseDate: timestamp('response_date'),
    responseStatus: varchar('response_status', { length: 50 }),
    responseNotes: text('response_notes'),

    // Audit Fields
    generatedBy: uuid('generated_by')
      .references(() => users.id)
      .notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    reportNumberIdx: unique('compliance_reports_number_company_unique').on(
      table.reportNumber,
      table.companyId
    ),
    typeIdx: index('compliance_reports_type_idx').on(table.reportType),
    statusIdx: index('compliance_reports_status_idx').on(table.status),
    periodIdx: index('compliance_reports_period_idx').on(
      table.reportingPeriodFrom,
      table.reportingPeriodTo
    ),
    submissionIdx: index('compliance_reports_submission_idx').on(
      table.submissionDate
    ),
    companyIdx: index('compliance_reports_company_idx').on(table.companyId),
  })
);

export const complianceReportsRelations = relations(
  complianceReports,
  ({ one }) => ({
    generator: one(users, {
      fields: [complianceReports.generatedBy],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [complianceReports.approvedBy],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [complianceReports.companyId],
      references: [companies.id],
    }),
  })
);
