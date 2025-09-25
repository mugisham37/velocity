import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseCode: varchar('warehouse_code', { length: 50 }).notNull(),
    warehouseName: varchar('warehouse_name', { length: 255 }).notNull(),
    warehouseType: varchar('warehouse_type', { length: 50 }).default('Stock'), // Stock, Transit, Sample, Quarantine, Returns
    parentWarehouseId: uuid('parent_warehouse_id'),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),

    // Address Information
    address: jsonb('address'),

    // Contact Information
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),

    // Capacity Management
    totalCapacity: decimal('total_capacity', { precision: 15, scale: 2 }),
    capacityUom: varchar('capacity_uom', { length: 20 }), // sqft, cbm, pallets, etc.
    usedCapacity: decimal('used_capacity', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Operational Settings
    allowNegativeStock: boolean('allow_negative_stock')
      .default(false)
      .notNull(),
    autoReorderEnabled: boolean('auto_reorder_enabled')
      .default(false)
      .notNull(),
    barcodeRequired: boolean('barcode_required').default(false).notNull(),

    // GPS Coordinates
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Operating Hours
    operatingHours: jsonb('operating_hours'), // { monday: { open: '08:00', close: '17:00' }, ... }

    // Settings
    isGroup: boolean('is_group').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),

    // Audit Fields
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    warehouseCodeIdx: unique('warehouses_code_company_unique').on(
      table.warehouseCode,
      table.companyId
    ),
    typeIdx: index('warehouses_type_idx').on(table.warehouseType),
    parentIdx: index('warehouses_parent_idx').on(table.parentWarehouseId),
    companyIdx: index('warehouses_company_idx').on(table.companyId),
    locationIdx: index('warehouses_location_idx').on(
      table.latitude,
      table.longitude
    ),
  })
);

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  company: one(companies, {
    fields: [warehouses.companyId],
    references: [companies.id],
  }),
  parentWarehouse: one(warehouses, {
    fields: [warehouses.parentWarehouseId],
    references: [warehouses.id],
  }),
  childWarehouses: many(warehouses),
  locations: many(warehouseLocations),
  creator: one(users, {
    fields: [warehouses.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [warehouses.updatedBy],
    references: [users.id],
  }),
  outboundTransfers: many(warehouseTransfers, {
    relationName: 'fromWarehouseTransfers',
  }),
  inboundTransfers: many(warehouseTransfers, {
    relationName: 'toWarehouseTransfers',
  }),
  performanceMetrics: many(warehousePerformanceMetrics),
}));

export const warehouseLocations = pgTable(
  'warehouse_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id, { onDelete: 'cascade' })
      .notNull(),
    locationCode: varchar('location_code', { length: 50 }).notNull(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    parentLocationId: uuid('parent_location_id'),

    // Location Details
    aisle: varchar('aisle', { length: 20 }),
    rack: varchar('rack', { length: 20 }),
    shelf: varchar('shelf', { length: 20 }),
    bin: varchar('bin', { length: 20 }),

    // Capacity Management
    capacity: decimal('capacity', { precision: 15, scale: 2 }),
    capacityUom: varchar('capacity_uom', { length: 20 }),
    usedCapacity: decimal('used_capacity', { precision: 15, scale: 2 }).default(
      '0'
    ),

    // Physical Properties
    length: decimal('length', { precision: 15, scale: 3 }),
    width: decimal('width', { precision: 15, scale: 3 }),
    height: decimal('height', { precision: 15, scale: 3 }),
    dimensionUom: varchar('dimension_uom', { length: 20 }),

    // Barcode Integration
    barcode: varchar('barcode', { length: 100 }),
    barcodeType: varchar('barcode_type', { length: 20 }),

    // Location Type and Restrictions
    locationType: varchar('location_type', { length: 50 }).default('Storage'), // Storage, Picking, Packing, Staging, Quarantine
    temperatureControlled: boolean('temperature_controlled')
      .default(false)
      .notNull(),
    minTemperature: decimal('min_temperature', { precision: 5, scale: 2 }),
    maxTemperature: decimal('max_temperature', { precision: 5, scale: 2 }),
    temperatureUom: varchar('temperature_uom', { length: 10 }).default('C'), // C or F

    // Access Control
    restrictedAccess: boolean('restricted_access').default(false).notNull(),
    accessLevel: varchar('access_level', { length: 50 }), // Public, Restricted, Secure

    // Settings
    isGroup: boolean('is_group').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),

    // Audit Fields
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    locationCodeIdx: unique('warehouse_locations_code_warehouse_unique').on(
      table.locationCode,
      table.warehouseId
    ),
    warehouseIdx: index('warehouse_locations_warehouse_idx').on(
      table.warehouseId
    ),
    parentIdx: index('warehouse_locations_parent_idx').on(
      table.parentLocationId
    ),
    typeIdx: index('warehouse_locations_type_idx').on(table.locationType),
    barcodeIdx: index('warehouse_locations_barcode_idx').on(table.barcode),
  })
);

export const warehouseLocationsRelations = relations(
  warehouseLocations,
  ({ one, many }) => ({
    warehouse: one(warehouses, {
      fields: [warehouseLocations.warehouseId],
      references: [warehouses.id],
    }),
    parentLocation: one(warehouseLocations, {
      fields: [warehouseLocations.parentLocationId],
      references: [warehouseLocations.id],
    }),
    childLocations: many(warehouseLocations),
    creator: one(users, {
      fields: [warehouseLocations.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [warehouseLocations.updatedBy],
      references: [users.id],
    }),
    transfers: many(warehouseTransfers, {
      relationName: 'fromLocationTransfers',
    }),
    receivedTransfers: many(warehouseTransfers, {
      relationName: 'toLocationTransfers',
    }),
  })
);

// Warehouse Transfers for tracking stock movements between warehouses/locations
export const warehouseTransfers = pgTable(
  'warehouse_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull(),

    // Source and Destination
    fromWarehouseId: uuid('from_warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    toWarehouseId: uuid('to_warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    fromLocationId: uuid('from_location_id').references(
      () => warehouseLocations.id
    ),
    toLocationId: uuid('to_location_id').references(
      () => warehouseLocations.id
    ),

    // Transfer Details
    transferDate: timestamp('transfer_date').notNull(),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    actualDeliveryDate: timestamp('actual_delivery_date'),

    // Status and Tracking
    status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, In Transit, Delivered, Cancelled
    trackingNumber: varchar('tracking_number', { length: 100 }),
    carrier: varchar('carrier', { length: 100 }),

    // Cost Information
    shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }).default(
      '0'
    ),
    currency: varchar('currency', { length: 3 }).default('USD'),

    // Additional Information
    reason: varchar('reason', { length: 100 }), // Restock, Customer Order, Maintenance, etc.
    notes: text('notes'),

    // Approval Workflow
    requiresApproval: boolean('requires_approval').default(false).notNull(),
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
    transferNumberIdx: unique('warehouse_transfers_number_company_unique').on(
      table.transferNumber,
      table.companyId
    ),
    fromWarehouseIdx: index('warehouse_transfers_from_warehouse_idx').on(
      table.fromWarehouseId
    ),
    toWarehouseIdx: index('warehouse_transfers_to_warehouse_idx').on(
      table.toWarehouseId
    ),
    statusIdx: index('warehouse_transfers_status_idx').on(table.status),
    dateIdx: index('warehouse_transfers_date_idx').on(table.transferDate),
    companyIdx: index('warehouse_transfers_company_idx').on(table.companyId),
  })
);

export const warehouseTransfersRelations = relations(
  warehouseTransfers,
  ({ one, many }) => ({
    fromWarehouse: one(warehouses, {
      fields: [warehouseTransfers.fromWarehouseId],
      references: [warehouses.id],
      relationName: 'fromWarehouseTransfers',
    }),
    toWarehouse: one(warehouses, {
      fields: [warehouseTransfers.toWarehouseId],
      references: [warehouses.id],
      relationName: 'toWarehouseTransfers',
    }),
    fromLocation: one(warehouseLocations, {
      fields: [warehouseTransfers.fromLocationId],
      references: [warehouseLocations.id],
      relationName: 'fromLocationTransfers',
    }),
    toLocation: one(warehouseLocations, {
      fields: [warehouseTransfers.toLocationId],
      references: [warehouseLocations.id],
      relationName: 'toLocationTransfers',
    }),
    company: one(companies, {
      fields: [warehouseTransfers.companyId],
      references: [companies.id],
    }),
    creator: one(users, {
      fields: [warehouseTransfers.createdBy],
      references: [users.id],
    }),
    updater: one(users, {
      fields: [warehouseTransfers.updatedBy],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [warehouseTransfers.approvedBy],
      references: [users.id],
    }),
    transferItems: many(warehouseTransferItems),
  })
);

// Warehouse Transfer Items for detailed item-level transfer information
export const warehouseTransferItems = pgTable(
  'warehouse_transfer_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferId: uuid('transfer_id')
      .references(() => warehouseTransfers.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id)
      .notNull(),

    // Quantity Information
    requestedQty: decimal('requested_qty', {
      precision: 15,
      scale: 2,
    }).notNull(),
    shippedQty: decimal('shipped_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    receivedQty: decimal('received_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    uom: varchar('uom', { length: 20 }).notNull(),

    // Serial/Batch Tracking
    serialNumbers: jsonb('serial_numbers'), // Array of serial numbers
    batchNumbers: jsonb('batch_numbers'), // Array of batch numbers with quantities

    // Condition and Quality
    condition: varchar('condition', { length: 50 }).default('Good'), // Good, Damaged, Expired
    qualityNotes: text('quality_notes'),

    // Cost Information
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }).default('0'),
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }).default('0'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    transferIdx: index('warehouse_transfer_items_transfer_idx').on(
      table.transferId
    ),
    itemIdx: index('warehouse_transfer_items_item_idx').on(table.itemId),
  })
);

export const warehouseTransferItemsRelations = relations(
  warehouseTransferItems,
  ({ one }) => ({
    transfer: one(warehouseTransfers, {
      fields: [warehouseTransferItems.transferId],
      references: [warehouseTransfers.id],
    }),
    item: one(items, {
      fields: [warehouseTransferItems.itemId],
      references: [items.id],
    }),
  })
);

// Warehouse Performance Analytics
export const warehousePerformanceMetrics = pgTable(
  'warehouse_performance_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id, { onDelete: 'cascade' })
      .notNull(),

    // Time Period
    metricDate: timestamp('metric_date').notNull(),
    periodType: varchar('period_type', { length: 20 }).notNull(), // Daily, Weekly, Monthly, Quarterly, Yearly

    // Capacity Metrics
    totalCapacityUtilization: decimal('total_capacity_utilization', {
      precision: 5,
      scale: 2,
    }).default('0'), // Percentage
    averageCapacityUtilization: decimal('average_capacity_utilization', {
      precision: 5,
      scale: 2,
    }).default('0'),
    peakCapacityUtilization: decimal('peak_capacity_utilization', {
      precision: 5,
      scale: 2,
    }).default('0'),

    // Throughput Metrics
    totalInboundVolume: decimal('total_inbound_volume', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalOutboundVolume: decimal('total_outbound_volume', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalTransferVolume: decimal('total_transfer_volume', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Efficiency Metrics
    averagePickTime: decimal('average_pick_time', {
      precision: 10,
      scale: 2,
    }).default('0'), // Minutes
    averagePackTime: decimal('average_pack_time', {
      precision: 10,
      scale: 2,
    }).default('0'), // Minutes
    averagePutawayTime: decimal('average_putaway_time', {
      precision: 10,
      scale: 2,
    }).default('0'), // Minutes

    // Accuracy Metrics
    pickAccuracy: decimal('pick_accuracy', { precision: 5, scale: 2 }).default(
      '100'
    ), // Percentage
    inventoryAccuracy: decimal('inventory_accuracy', {
      precision: 5,
      scale: 2,
    }).default('100'), // Percentage

    // Cost Metrics
    operatingCostPerUnit: decimal('operating_cost_per_unit', {
      precision: 15,
      scale: 4,
    }).default('0'),
    laborCostPercentage: decimal('labor_cost_percentage', {
      precision: 5,
      scale: 2,
    }).default('0'),

    // Quality Metrics
    damageRate: decimal('damage_rate', { precision: 5, scale: 2 }).default('0'), // Percentage
    returnRate: decimal('return_rate', { precision: 5, scale: 2 }).default('0'), // Percentage

    // Additional KPIs
    orderFulfillmentRate: decimal('order_fulfillment_rate', {
      precision: 5,
      scale: 2,
    }).default('100'), // Percentage
    onTimeDeliveryRate: decimal('on_time_delivery_rate', {
      precision: 5,
      scale: 2,
    }).default('100'), // Percentage

    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    warehouseMetricIdx: index('warehouse_performance_warehouse_idx').on(
      table.warehouseId
    ),
    dateIdx: index('warehouse_performance_date_idx').on(table.metricDate),
    periodIdx: index('warehouse_performance_period_idx').on(table.periodType),
    companyIdx: index('warehouse_performance_company_idx').on(table.companyId),
    uniqueMetricIdx: unique('warehouse_performance_unique').on(
      table.warehouseId,
      table.metricDate,
      table.periodType
    ),
  })
);

export const warehousePerformanceMetricsRelations = relations(
  warehousePerformanceMetrics,
  ({ one }) => ({
    warehouse: one(warehouses, {
      fields: [warehousePerformanceMetrics.warehouseId],
      references: [warehouses.id],
    }),
    company: one(companies, {
      fields: [warehousePerformanceMetrics.companyId],
      references: [companies.id],
    }),
  })
);

// Import users and items for relations
import { items } from './items';
import { users } from './users';
