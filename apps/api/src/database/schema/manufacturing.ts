import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { items } from './items';
import { users } from './users';
import { warehouses } from './warehouses';

// Bill of Materials (BOM) main table
export const boms = pgTable(
  'boms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomNo: varchar('bom_no', { length: 50 }).notNull(),
    itemId: uuid('item_id').notNull(),
    companyId: uuid('company_id').notNull(),
    version: varchar('version', { length: 20 }).notNull().default('1.0'),
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false),
    description: text('description'),
    quantity: decimal('quantity', { precision: 15, scale: 6 })
      .notNull()
      .default('1'),
    uom: varchar('uom', { length: 50 }).notNull(),
    operatingCost: decimal('operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    rawMaterialCost: decimal('raw_material_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }).default('0'),
    bomType: varchar('bom_type', { length: 50 })
      .notNull()
      .default('Manufacturing'),
    withOperations: boolean('with_operations').default(false),
    transferMaterialAgainst: varchar('transfer_material_against', {
      length: 50,
    }).default('Work Order'),
    allowAlternativeItem: boolean('allow_alternative_item').default(false),
    allowSameItemMultipleTimes: boolean(
      'allow_same_item_multiple_times'
    ).default(false),
    setRateOfSubAssemblyItemBasedOnBom: boolean(
      'set_rate_of_sub_assembly_item_based_on_bom'
    ).default(true),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    priceListRate: decimal('price_list_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    baseRawMaterialCost: decimal('base_raw_material_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    baseOperatingCost: decimal('base_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    baseTotalCost: decimal('base_total_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    inspectionRequired: boolean('inspection_required').default(false),
    qualityInspectionTemplate: varchar('quality_inspection_template', {
      length: 255,
    }),
    projectId: uuid('project_id'),
    routingId: uuid('routing_id'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    bomNoIdx: index('idx_bom_no').on(table.bomNo),
    itemIdIdx: index('idx_bom_item_id').on(table.itemId),
    companyIdIdx: index('idx_bom_company_id').on(table.companyId),
    versionIdx: index('idx_bom_version').on(table.version),
    isActiveIdx: index('idx_bom_is_active').on(table.isActive),
    itemCompanyFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// BOM Items (components/materials in a BOM)
export const bomItems = pgTable(
  'bom_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomId: uuid('bom_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 500 }),
    qty: decimal('qty', { precision: 15, scale: 6 }).notNull(),
    uom: varchar('uom', { length: 50 }).notNull(),
    rate: decimal('rate', { precision: 15, scale: 2 }).default('0'),
    baseRate: decimal('base_rate', { precision: 15, scale: 2 }).default('0'),
    amount: decimal('amount', { precision: 15, scale: 2 }).default('0'),
    baseAmount: decimal('base_amount', { precision: 15, scale: 2 }).default(
      '0'
    ),
    stockQty: decimal('stock_qty', { precision: 15, scale: 6 }).default('0'),
    stockUom: varchar('stock_uom', { length: 50 }),
    conversionFactor: decimal('conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),
    bomNo: varchar('bom_no', { length: 50 }),
    allowAlternativeItem: boolean('allow_alternative_item').default(false),
    includeItemInManufacturing: boolean(
      'include_item_in_manufacturing'
    ).default(true),
    sourced_by_supplier: boolean('sourced_by_supplier').default(false),
    originalItem: uuid('original_item'),
    operationId: uuid('operation_id'),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    bomIdIdx: index('idx_bom_items_bom_id').on(table.bomId),
    itemIdIdx: index('idx_bom_items_item_id').on(table.itemId),
    bomItemFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
  })
);

// BOM Operations (routing operations for manufacturing)
export const bomOperations = pgTable(
  'bom_operations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomId: uuid('bom_id').notNull(),
    operationNo: varchar('operation_no', { length: 50 }).notNull(),
    operationName: varchar('operation_name', { length: 255 }).notNull(),
    description: text('description'),
    workstationId: uuid('workstation_id'),
    workstationType: varchar('workstation_type', { length: 100 }),
    timeInMins: decimal('time_in_mins', { precision: 15, scale: 2 }).default(
      '0'
    ),
    operatingCost: decimal('operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    baseOperatingCost: decimal('base_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    hourRate: decimal('hour_rate', { precision: 15, scale: 2 }).default('0'),
    baseHourRate: decimal('base_hour_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    batchSize: integer('batch_size').default(1),
    fixedTimeInMins: decimal('fixed_time_in_mins', {
      precision: 15,
      scale: 2,
    }).default('0'),
    setUpTime: decimal('set_up_time', { precision: 15, scale: 2 }).default('0'),
    tearDownTime: decimal('tear_down_time', {
      precision: 15,
      scale: 2,
    }).default('0'),
    sequenceId: integer('sequence_id').default(0),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    bomIdIdx: index('idx_bom_operations_bom_id').on(table.bomId),
    operationNoIdx: index('idx_bom_operations_operation_no').on(
      table.operationNo
    ),
    sequenceIdx: index('idx_bom_operations_sequence').on(table.sequenceId),
    bomOperationFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
  })
);

// BOM Scrap Items (items that are scrapped during manufacturing)
export const bomScrapItems = pgTable(
  'bom_scrap_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomId: uuid('bom_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    stockQty: decimal('stock_qty', { precision: 15, scale: 6 }).default('0'),
    rate: decimal('rate', { precision: 15, scale: 2 }).default('0'),
    amount: decimal('amount', { precision: 15, scale: 2 }).default('0'),
    baseRate: decimal('base_rate', { precision: 15, scale: 2 }).default('0'),
    baseAmount: decimal('base_amount', { precision: 15, scale: 2 }).default(
      '0'
    ),
    stockUom: varchar('stock_uom', { length: 50 }),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    bomIdIdx: index('idx_bom_scrap_items_bom_id').on(table.bomId),
    itemIdIdx: index('idx_bom_scrap_items_item_id').on(table.itemId),
    bomScrapFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
  })
);

// BOM Alternative Items (substitute items for BOM components)
export const bomAlternativeItems = pgTable(
  'bom_alternative_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomItemId: uuid('bom_item_id').notNull(),
    alternativeItemId: uuid('alternative_item_id').notNull(),
    alternativeItemCode: varchar('alternative_item_code', {
      length: 100,
    }).notNull(),
    alternativeItemName: varchar('alternative_item_name', {
      length: 255,
    }).notNull(),
    conversionFactor: decimal('conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),
    priority: integer('priority').default(1),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    bomItemIdIdx: index('idx_bom_alt_items_bom_item_id').on(table.bomItemId),
    altItemIdIdx: index('idx_bom_alt_items_alt_item_id').on(
      table.alternativeItemId
    ),
    bomItemFk: foreignKey({
      columns: [table.bomItemId],
      foreignColumns: [bomItems.id],
    }),
    altItemFk: foreignKey({
      columns: [table.alternativeItemId],
      foreignColumns: [items.id],
    }),
  })
);

// BOM Update Log (track changes to BOMs)
export const bomUpdateLog = pgTable(
  'bom_update_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bomId: uuid('bom_id').notNull(),
    updateType: varchar('update_type', { length: 50 }).notNull(), // 'created', 'updated', 'version_created'
    changeDescription: text('change_description'),
    previousData: jsonb('previous_data'),
    newData: jsonb('new_data'),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    bomIdIdx: index('idx_bom_update_log_bom_id').on(table.bomId),
    updateTypeIdx: index('idx_bom_update_log_update_type').on(table.updateType),
    createdAtIdx: index('idx_bom_update_log_created_at').on(table.createdAt),
    bomLogFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
    updatedByFk: foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
    }),
  })
);

// Workstations (manufacturing workstations/work centers)
export const workstations = pgTable(
  'workstations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workstationName: varchar('workstation_name', { length: 255 }).notNull(),
    workstationType: varchar('workstation_type', { length: 100 }),
    companyId: uuid('company_id').notNull(),
    warehouseId: uuid('warehouse_id'),
    description: text('description'),
    hourRate: decimal('hour_rate', { precision: 15, scale: 2 }).default('0'),
    hourRateElectricity: decimal('hour_rate_electricity', {
      precision: 15,
      scale: 2,
    }).default('0'),
    hourRateConsumable: decimal('hour_rate_consumable', {
      precision: 15,
      scale: 2,
    }).default('0'),
    hourRateRent: decimal('hour_rate_rent', {
      precision: 15,
      scale: 2,
    }).default('0'),
    hourRateLabour: decimal('hour_rate_labour', {
      precision: 15,
      scale: 2,
    }).default('0'),
    productionCapacity: decimal('production_capacity', {
      precision: 15,
      scale: 2,
    }).default('1'),
    workingHoursStart: varchar('working_hours_start', { length: 10 }),
    workingHoursEnd: varchar('working_hours_end', { length: 10 }),
    holidayList: varchar('holiday_list', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workstationNameIdx: index('idx_workstation_name').on(table.workstationName),
    companyIdIdx: index('idx_workstation_company_id').on(table.companyId),
    warehouseIdIdx: index('idx_workstation_warehouse_id').on(table.warehouseId),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
  })
);

// Define relations
export const bomsRelations = relations(boms, ({ one, many }) => ({
  item: one(items, {
    fields: [boms.itemId],
    references: [items.id],
  }),
  company: one(companies, {
    fields: [boms.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [boms.createdBy],
    references: [users.id],
  }),
  bomItems: many(bomItems),
  bomOperations: many(bomOperations),
  bomScrapItems: many(bomScrapItems),
  bomUpdateLogs: many(bomUpdateLog),
}));

export const bomItemsRelations = relations(bomItems, ({ one, many }) => ({
  bom: one(boms, {
    fields: [bomItems.bomId],
    references: [boms.id],
  }),
  item: one(items, {
    fields: [bomItems.itemId],
    references: [items.id],
  }),
  alternativeItems: many(bomAlternativeItems),
}));

export const bomOperationsRelations = relations(bomOperations, ({ one }) => ({
  bom: one(boms, {
    fields: [bomOperations.bomId],
    references: [boms.id],
  }),
  workstation: one(workstations, {
    fields: [bomOperations.workstationId],
    references: [workstations.id],
  }),
}));

export const bomScrapItemsRelations = relations(bomScrapItems, ({ one }) => ({
  bom: one(boms, {
    fields: [bomScrapItems.bomId],
    references: [boms.id],
  }),
  item: one(items, {
    fields: [bomScrapItems.itemId],
    references: [items.id],
  }),
}));

export const bomAlternativeItemsRelations = relations(
  bomAlternativeItems,
  ({ one }) => ({
    bomItem: one(bomItems, {
      fields: [bomAlternativeItems.bomItemId],
      references: [bomItems.id],
    }),
    alternativeItem: one(items, {
      fields: [bomAlternativeItems.alternativeItemId],
      references: [items.id],
    }),
  })
);

export const bomUpdateLogRelations = relations(bomUpdateLog, ({ one }) => ({
  bom: one(boms, {
    fields: [bomUpdateLog.bomId],
    references: [boms.id],
  }),
  updatedBy: one(users, {
    fields: [bomUpdateLog.updatedBy],
    references: [users.id],
  }),
}));

// Production Plans (master production schedule)
export const productionPlans = pgTable(
  'production_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planName: varchar('plan_name', { length: 255 }).notNull(),
    companyId: uuid('company_id').notNull(),
    fromDate: timestamp('from_date').notNull(),
    toDate: timestamp('to_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Submitted, Completed, Cancelled
    description: text('description'),
    getItemsFromOpenSalesOrders: boolean(
      'get_items_from_open_sales_orders'
    ).default(false),
    downloadMaterialsRequired: boolean('download_materials_required').default(
      false
    ),
    ignoreExistingOrderedQty: boolean('ignore_existing_ordered_qty').default(
      false
    ),
    considerMinOrderQty: boolean('consider_min_order_qty').default(false),
    includeNonStockItems: boolean('include_non_stock_items').default(false),
    includeSubcontractedItems: boolean('include_subcontracted_items').default(
      false
    ),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    planNameIdx: index('idx_production_plan_name').on(table.planName),
    companyIdIdx: index('idx_production_plan_company_id').on(table.companyId),
    statusIdx: index('idx_production_plan_status').on(table.status),
    fromDateIdx: index('idx_production_plan_from_date').on(table.fromDate),
    toDateIdx: index('idx_production_plan_to_date').on(table.toDate),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// Production Plan Items
export const productionPlanItems = pgTable(
  'production_plan_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productionPlanId: uuid('production_plan_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    bomId: uuid('bom_id'),
    bomNo: varchar('bom_no', { length: 50 }),
    plannedQty: decimal('planned_qty', { precision: 15, scale: 6 }).notNull(),
    pendingQty: decimal('pending_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    producedQty: decimal('produced_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    uom: varchar('uom', { length: 50 }).notNull(),
    warehouseId: uuid('warehouse_id'),
    plannedStartDate: timestamp('planned_start_date'),
    plannedEndDate: timestamp('planned_end_date'),
    actualStartDate: timestamp('actual_start_date'),
    actualEndDate: timestamp('actual_end_date'),
    description: text('description'),
    salesOrderId: uuid('sales_order_id'),
    salesOrderItem: varchar('sales_order_item', { length: 100 }),
    materialRequestId: uuid('material_request_id'),
    workOrderId: uuid('work_order_id'),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    productionPlanIdIdx: index('idx_production_plan_items_plan_id').on(
      table.productionPlanId
    ),
    itemIdIdx: index('idx_production_plan_items_item_id').on(table.itemId),
    bomIdIdx: index('idx_production_plan_items_bom_id').on(table.bomId),
    warehouseIdIdx: index('idx_production_plan_items_warehouse_id').on(
      table.warehouseId
    ),
    plannedStartDateIdx: index(
      'idx_production_plan_items_planned_start_date'
    ).on(table.plannedStartDate),
    productionPlanFk: foreignKey({
      columns: [table.productionPlanId],
      foreignColumns: [productionPlans.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    bomFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
  })
);

// Material Requirements Planning (MRP)
export const mrpRuns = pgTable(
  'mrp_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runName: varchar('run_name', { length: 255 }).notNull(),
    companyId: uuid('company_id').notNull(),
    fromDate: timestamp('from_date').notNull(),
    toDate: timestamp('to_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Running, Completed, Failed
    includeNonStockItems: boolean('include_non_stock_items').default(false),
    includeSubcontractedItems: boolean('include_subcontracted_items').default(
      false
    ),
    ignoreExistingOrderedQty: boolean('ignore_existing_ordered_qty').default(
      false
    ),
    considerMinOrderQty: boolean('consider_min_order_qty').default(false),
    considerSafetyStock: boolean('consider_safety_stock').default(true),
    warehouseId: uuid('warehouse_id'),
    itemGroupId: uuid('item_group_id'),
    buyerId: uuid('buyer_id'),
    projectId: uuid('project_id'),
    runStartTime: timestamp('run_start_time'),
    runEndTime: timestamp('run_end_time'),
    errorLog: text('error_log'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    runNameIdx: index('idx_mrp_run_name').on(table.runName),
    companyIdIdx: index('idx_mrp_run_company_id').on(table.companyId),
    statusIdx: index('idx_mrp_run_status').on(table.status),
    fromDateIdx: index('idx_mrp_run_from_date').on(table.fromDate),
    toDateIdx: index('idx_mrp_run_to_date').on(table.toDate),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// MRP Results
export const mrpResults = pgTable(
  'mrp_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mrpRunId: uuid('mrp_run_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    warehouseId: uuid('warehouse_id'),
    requiredDate: timestamp('required_date').notNull(),
    plannedOrderDate: timestamp('planned_order_date'),
    plannedOrderReceipt: timestamp('planned_order_receipt'),
    grossRequirement: decimal('gross_requirement', {
      precision: 15,
      scale: 6,
    }).default('0'),
    scheduledReceipts: decimal('scheduled_receipts', {
      precision: 15,
      scale: 6,
    }).default('0'),
    projectedAvailableBalance: decimal('projected_available_balance', {
      precision: 15,
      scale: 6,
    }).default('0'),
    netRequirement: decimal('net_requirement', {
      precision: 15,
      scale: 6,
    }).default('0'),
    plannedOrderQuantity: decimal('planned_order_quantity', {
      precision: 15,
      scale: 6,
    }).default('0'),
    uom: varchar('uom', { length: 50 }).notNull(),
    leadTimeDays: integer('lead_time_days').default(0),
    safetyStock: decimal('safety_stock', { precision: 15, scale: 6 }).default(
      '0'
    ),
    minOrderQty: decimal('min_order_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    maxOrderQty: decimal('max_order_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    orderMultiple: decimal('order_multiple', {
      precision: 15,
      scale: 6,
    }).default('1'),
    actionRequired: varchar('action_required', { length: 100 }), // Purchase, Manufacture, Transfer
    sourceDocument: varchar('source_document', { length: 255 }),
    sourceDocumentId: uuid('source_document_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    mrpRunIdIdx: index('idx_mrp_results_run_id').on(table.mrpRunId),
    itemIdIdx: index('idx_mrp_results_item_id').on(table.itemId),
    warehouseIdIdx: index('idx_mrp_results_warehouse_id').on(table.warehouseId),
    requiredDateIdx: index('idx_mrp_results_required_date').on(
      table.requiredDate
    ),
    actionRequiredIdx: index('idx_mrp_results_action_required').on(
      table.actionRequired
    ),
    mrpRunFk: foreignKey({
      columns: [table.mrpRunId],
      foreignColumns: [mrpRuns.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
  })
);

// Capacity Planning
export const capacityPlans = pgTable(
  'capacity_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planName: varchar('plan_name', { length: 255 }).notNull(),
    companyId: uuid('company_id').notNull(),
    fromDate: timestamp('from_date').notNull(),
    toDate: timestamp('to_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Running, Completed, Failed
    workstationId: uuid('workstation_id'),
    includeWorkOrders: boolean('include_work_orders').default(true),
    includeProductionPlans: boolean('include_production_plans').default(true),
    includeMaintenanceSchedule: boolean('include_maintenance_schedule').default(
      false
    ),
    capacityUom: varchar('capacity_uom', { length: 50 }).default('Hours'),
    runStartTime: timestamp('run_start_time'),
    runEndTime: timestamp('run_end_time'),
    errorLog: text('error_log'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    planNameIdx: index('idx_capacity_plan_name').on(table.planName),
    companyIdIdx: index('idx_capacity_plan_company_id').on(table.companyId),
    statusIdx: index('idx_capacity_plan_status').on(table.status),
    fromDateIdx: index('idx_capacity_plan_from_date').on(table.fromDate),
    toDateIdx: index('idx_capacity_plan_to_date').on(table.toDate),
    workstationIdIdx: index('idx_capacity_plan_workstation_id').on(
      table.workstationId
    ),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    workstationFk: foreignKey({
      columns: [table.workstationId],
      foreignColumns: [workstations.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// Capacity Plan Results
export const capacityPlanResults = pgTable(
  'capacity_plan_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capacityPlanId: uuid('capacity_plan_id').notNull(),
    workstationId: uuid('workstation_id').notNull(),
    workstationName: varchar('workstation_name', { length: 255 }).notNull(),
    planningDate: timestamp('planning_date').notNull(),
    availableCapacity: decimal('available_capacity', {
      precision: 15,
      scale: 2,
    }).default('0'),
    plannedCapacity: decimal('planned_capacity', {
      precision: 15,
      scale: 2,
    }).default('0'),
    capacityUtilization: decimal('capacity_utilization', {
      precision: 5,
      scale: 2,
    }).default('0'), // Percentage
    overloadHours: decimal('overload_hours', {
      precision: 15,
      scale: 2,
    }).default('0'),
    underloadHours: decimal('underload_hours', {
      precision: 15,
      scale: 2,
    }).default('0'),
    capacityUom: varchar('capacity_uom', { length: 50 }).default('Hours'),
    sourceDocument: varchar('source_document', { length: 255 }),
    sourceDocumentId: uuid('source_document_id'),
    operationId: uuid('operation_id'),
    operationName: varchar('operation_name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    capacityPlanIdIdx: index('idx_capacity_plan_results_plan_id').on(
      table.capacityPlanId
    ),
    workstationIdIdx: index('idx_capacity_plan_results_workstation_id').on(
      table.workstationId
    ),
    planningDateIdx: index('idx_capacity_plan_results_planning_date').on(
      table.planningDate
    ),
    capacityPlanFk: foreignKey({
      columns: [table.capacityPlanId],
      foreignColumns: [capacityPlans.id],
    }),
    workstationFk: foreignKey({
      columns: [table.workstationId],
      foreignColumns: [workstations.id],
    }),
  })
);

// Production Forecasts
export const productionForecasts = pgTable(
  'production_forecasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    forecastName: varchar('forecast_name', { length: 255 }).notNull(),
    companyId: uuid('company_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    forecastDate: timestamp('forecast_date').notNull(),
    forecastQuantity: decimal('forecast_quantity', {
      precision: 15,
      scale: 6,
    }).notNull(),
    uom: varchar('uom', { length: 50 }).notNull(),
    warehouseId: uuid('warehouse_id'),
    salesOrderId: uuid('sales_order_id'),
    forecastType: varchar('forecast_type', { length: 50 }).default('Manual'), // Manual, AI_Generated, Historical_Average
    confidenceLevel: decimal('confidence_level', {
      precision: 5,
      scale: 2,
    }).default('0'), // Percentage
    seasonalFactor: decimal('seasonal_factor', {
      precision: 5,
      scale: 4,
    }).default('1'),
    trendFactor: decimal('trend_factor', { precision: 5, scale: 4 }).default(
      '1'
    ),
    actualQuantity: decimal('actual_quantity', {
      precision: 15,
      scale: 6,
    }).default('0'),
    variance: decimal('variance', { precision: 15, scale: 6 }).default('0'),
    variancePercentage: decimal('variance_percentage', {
      precision: 5,
      scale: 2,
    }).default('0'),
    notes: text('notes'),
    isActive: boolean('is_active').default(true),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    forecastNameIdx: index('idx_production_forecast_name').on(
      table.forecastName
    ),
    companyIdIdx: index('idx_production_forecast_company_id').on(
      table.companyId
    ),
    itemIdIdx: index('idx_production_forecast_item_id').on(table.itemId),
    forecastDateIdx: index('idx_production_forecast_date').on(
      table.forecastDate
    ),
    forecastTypeIdx: index('idx_production_forecast_type').on(
      table.forecastType
    ),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

export const workstationsRelations = relations(
  workstations,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [workstations.companyId],
      references: [companies.id],
    }),
    warehouse: one(warehouses, {
      fields: [workstations.warehouseId],
      references: [warehouses.id],
    }),
    bomOperations: many(bomOperations),
    capacityPlanResults: many(capacityPlanResults),
  })
);

// Production Plan Relations
export const productionPlansRelations = relations(
  productionPlans,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [productionPlans.companyId],
      references: [companies.id],
    }),
    createdBy: one(users, {
      fields: [productionPlans.createdBy],
      references: [users.id],
    }),
    items: many(productionPlanItems),
  })
);

export const productionPlanItemsRelations = relations(
  productionPlanItems,
  ({ one }) => ({
    productionPlan: one(productionPlans, {
      fields: [productionPlanItems.productionPlanId],
      references: [productionPlans.id],
    }),
    item: one(items, {
      fields: [productionPlanItems.itemId],
      references: [items.id],
    }),
    bom: one(boms, {
      fields: [productionPlanItems.bomId],
      references: [boms.id],
    }),
    warehouse: one(warehouses, {
      fields: [productionPlanItems.warehouseId],
      references: [warehouses.id],
    }),
  })
);

// MRP Relations
export const mrpRunsRelations = relations(mrpRuns, ({ one, many }) => ({
  company: one(companies, {
    fields: [mrpRuns.companyId],
    references: [companies.id],
  }),
  warehouse: one(warehouses, {
    fields: [mrpRuns.warehouseId],
    references: [warehouses.id],
  }),
  createdBy: one(users, {
    fields: [mrpRuns.createdBy],
    references: [users.id],
  }),
  results: many(mrpResults),
}));

export const mrpResultsRelations = relations(mrpResults, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpResults.mrpRunId],
    references: [mrpRuns.id],
  }),
  item: one(items, {
    fields: [mrpResults.itemId],
    references: [items.id],
  }),
  warehouse: one(warehouses, {
    fields: [mrpResults.warehouseId],
    references: [warehouses.id],
  }),
}));

// Capacity Planning Relations
export const capacityPlansRelations = relations(
  capacityPlans,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [capacityPlans.companyId],
      references: [companies.id],
    }),
    workstation: one(workstations, {
      fields: [capacityPlans.workstationId],
      references: [workstations.id],
    }),
    createdBy: one(users, {
      fields: [capacityPlans.createdBy],
      references: [users.id],
    }),
    results: many(capacityPlanResults),
  })
);

export const capacityPlanResultsRelations = relations(
  capacityPlanResults,
  ({ one }) => ({
    capacityPlan: one(capacityPlans, {
      fields: [capacityPlanResults.capacityPlanId],
      references: [capacityPlans.id],
    }),
    workstation: one(workstations, {
      fields: [capacityPlanResults.workstationId],
      references: [workstations.id],
    }),
  })
);

// Production Forecast Relations
export const productionForecastsRelations = relations(
  productionForecasts,
  ({ one }) => ({
    company: one(companies, {
      fields: [productionForecasts.companyId],
      references: [companies.id],
    }),
    item: one(items, {
      fields: [productionForecasts.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [productionForecasts.warehouseId],
      references: [warehouses.id],
    }),
    createdBy: one(users, {
      fields: [productionForecasts.createdBy],
      references: [users.id],
    }),
  })
);

// Work Orders (production orders)
export const workOrders = pgTable(
  'work_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderNo: varchar('work_order_no', { length: 50 }).notNull(),
    companyId: uuid('company_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    bomId: uuid('bom_id'),
    bomNo: varchar('bom_no', { length: 50 }),
    productionPlanId: uuid('production_plan_id'),
    salesOrderId: uuid('sales_order_id'),
    salesOrderItem: varchar('sales_order_item', { length: 100 }),
    qtyToManufacture: decimal('qty_to_manufacture', {
      precision: 15,
      scale: 6,
    }).notNull(),
    manufacturedQty: decimal('manufactured_qty', {
      precision: 15,
      scale: 6,
    }).default('0'),
    pendingQty: decimal('pending_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    uom: varchar('uom', { length: 50 }).notNull(),
    warehouseId: uuid('warehouse_id').notNull(),
    sourceWarehouseId: uuid('source_warehouse_id'),
    wipWarehouseId: uuid('wip_warehouse_id'),
    fgWarehouseId: uuid('fg_warehouse_id'),
    scrapWarehouseId: uuid('scrap_warehouse_id'),
    plannedStartDate: timestamp('planned_start_date'),
    plannedEndDate: timestamp('planned_end_date'),
    actualStartDate: timestamp('actual_start_date'),
    actualEndDate: timestamp('actual_end_date'),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Released, In Progress, Completed, Cancelled, On Hold
    priority: varchar('priority', { length: 20 }).default('Medium'), // Low, Medium, High, Urgent
    description: text('description'),
    projectId: uuid('project_id'),
    transferMaterialAgainst: varchar('transfer_material_against', {
      length: 50,
    }).default('Work Order'),
    useMultiLevelBom: boolean('use_multi_level_bom').default(true),
    skipTransfer: boolean('skip_transfer').default(false),
    allowAlternativeItem: boolean('allow_alternative_item').default(false),
    requiredItems: jsonb('required_items'), // Cached BOM explosion
    totalOperatingCost: decimal('total_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalRawMaterialCost: decimal('total_raw_material_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    additionalOperatingCost: decimal('additional_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    scrapWarehouseRequired: boolean('scrap_warehouse_required').default(false),
    batchSize: decimal('batch_size', { precision: 15, scale: 6 }).default('1'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workOrderNoIdx: index('idx_work_order_no').on(table.workOrderNo),
    companyIdIdx: index('idx_work_order_company_id').on(table.companyId),
    itemIdIdx: index('idx_work_order_item_id').on(table.itemId),
    bomIdIdx: index('idx_work_order_bom_id').on(table.bomId),
    statusIdx: index('idx_work_order_status').on(table.status),
    priorityIdx: index('idx_work_order_priority').on(table.priority),
    plannedStartDateIdx: index('idx_work_order_planned_start_date').on(
      table.plannedStartDate
    ),
    plannedEndDateIdx: index('idx_work_order_planned_end_date').on(
      table.plannedEndDate
    ),
    companyFk: foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    bomFk: foreignKey({
      columns: [table.bomId],
      foreignColumns: [boms.id],
    }),
    warehouseFk: foreignKey({
      columns: [table.warehouseId],
      foreignColumns: [warehouses.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// Work Order Operations (routing operations for work orders)
export const workOrderOperations = pgTable(
  'work_order_operations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').notNull(),
    operationId: uuid('operation_id'),
    operationNo: varchar('operation_no', { length: 50 }).notNull(),
    operationName: varchar('operation_name', { length: 255 }).notNull(),
    description: text('description'),
    workstationId: uuid('workstation_id'),
    workstationType: varchar('workstation_type', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending, In Progress, Completed, Cancelled
    plannedOperatingCost: decimal('planned_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    actualOperatingCost: decimal('actual_operating_cost', {
      precision: 15,
      scale: 2,
    }).default('0'),
    timeInMins: decimal('time_in_mins', { precision: 15, scale: 2 }).default(
      '0'
    ),
    actualTimeInMins: decimal('actual_time_in_mins', {
      precision: 15,
      scale: 2,
    }).default('0'),
    hourRate: decimal('hour_rate', { precision: 15, scale: 2 }).default('0'),
    hSize: integer('batch_size').default(1),
    completedQty: decimal('completed_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    processLossQty: decimal('process_loss_qty', {
      precision: 15,
      scale: 6,
    }).default('0'),
    plannedStartTime: timestamp('planned_start_time'),
    plannedEndTime: timestamp('planned_end_time'),
    actualStartTime: timestamp('actual_start_time'),
    actualEndTime: timestamp('actual_end_time'),
    sequenceId: integer('sequence_id').default(0),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workOrderIdIdx: index('idx_work_order_operations_work_order_id').on(
      table.workOrderId
    ),
    operationNoIdx: index('idx_work_order_operations_operation_no').on(
      table.operationNo
    ),
    workstationIdIdx: index('idx_work_order_operations_workstation_id').on(
      table.workstationId
    ),
    statusIdx: index('idx_work_order_operations_status').on(table.status),
    sequenceIdx: index('idx_work_order_operations_sequence').on(
      table.sequenceId
    ),
    workOrderFk: foreignKey({
      columns: [table.workOrderId],
      foreignColumns: [workOrders.id],
    }),
    workstationFk: foreignKey({
      columns: [table.workstationId],
      foreignColumns: [workstations.id],
    }),
  })
);

// Work Order Items (materials required for work orders)
export const workOrderItems = pgTable(
  'work_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').notNull(),
    itemId: uuid('item_id').notNull(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    description: text('description'),
    sourceWarehouseId: uuid('source_warehouse_id'),
    requiredQty: decimal('required_qty', { precision: 15, scale: 6 }).notNull(),
    transferredQty: decimal('transferred_qty', {
      precision: 15,
      scale: 6,
    }).default('0'),
    consumedQty: decimal('consumed_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    returnedQty: decimal('returned_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    availableQtyAtSourceWarehouse: decimal(
      'available_qty_at_source_warehouse',
      { precision: 15, scale: 6 }
    ).default('0'),
    availableQtyAtWipWarehouse: decimal('available_qty_at_wip_warehouse', {
      precision: 15,
      scale: 6,
    }).default('0'),
    uom: varchar('uom', { length: 50 }).notNull(),
    stockUom: varchar('stock_uom', { length: 50 }),
    conversionFactor: decimal('conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),
    rate: decimal('rate', { precision: 15, scale: 2 }).default('0'),
    amount: decimal('amount', { precision: 15, scale: 2 }).default('0'),
    bomItemId: uuid('bom_item_id'),
    operationId: uuid('operation_id'),
    allowAlternativeItem: boolean('allow_alternative_item').default(false),
    includeItemInManufacturing: boolean(
      'include_item_in_manufacturing'
    ).default(true),
    idx: integer('idx').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workOrderIdIdx: index('idx_work_order_items_work_order_id').on(
      table.workOrderId
    ),
    itemIdIdx: index('idx_work_order_items_item_id').on(table.itemId),
    sourceWarehouseIdIdx: index('idx_work_order_items_source_warehouse_id').on(
      table.sourceWarehouseId
    ),
    workOrderFk: foreignKey({
      columns: [table.workOrderId],
      foreignColumns: [workOrders.id],
    }),
    itemFk: foreignKey({
      columns: [table.itemId],
      foreignColumns: [items.id],
    }),
    sourceWarehouseFk: foreignKey({
      columns: [table.sourceWarehouseId],
      foreignColumns: [warehouses.id],
    }),
  })
);

// Stock Entries for Work Orders (material transfers and production entries)
export const workOrderStockEntries = pgTable(
  'work_order_stock_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').notNull(),
    stockEntryType: varchar('stock_entry_type', { length: 50 }).notNull(), // Material Transfer, Material Consumption, Manufacture
    stockEntryId: uuid('stock_entry_id'),
    purpose: varchar('purpose', { length: 100 }).notNull(),
    fromWarehouseId: uuid('from_warehouse_id'),
    toWarehouseId: uuid('to_warehouse_id'),
    totalOutgoingValue: decimal('total_outgoing_value', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalIncomingValue: decimal('total_incoming_value', {
      precision: 15,
      scale: 2,
    }).default('0'),
    totalAdditionalCosts: decimal('total_additional_costs', {
      precision: 15,
      scale: 2,
    }).default('0'),
    postingDate: timestamp('posting_date').notNull(),
    postingTime: varchar('posting_time', { length: 10 }),
    isSubmitted: boolean('is_submitted').default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workOrderIdIdx: index('idx_work_order_stock_entries_work_order_id').on(
      table.workOrderId
    ),
    stockEntryTypeIdx: index('idx_work_order_stock_entries_type').on(
      table.stockEntryType
    ),
    postingDateIdx: index('idx_work_order_stock_entries_posting_date').on(
      table.postingDate
    ),
    workOrderFk: foreignKey({
      columns: [table.workOrderId],
      foreignColumns: [workOrders.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// Work Order Time Logs (labor time tracking)
export const workOrderTimeLogs = pgTable(
  'work_order_time_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id').notNull(),
    operationId: uuid('operation_id'),
    employeeId: uuid('employee_id'),
    employeeName: varchar('employee_name', { length: 255 }),
    fromTime: timestamp('from_time').notNull(),
    toTime: timestamp('to_time'),
    timeInMins: decimal('time_in_mins', { precision: 15, scale: 2 }).default(
      '0'
    ),
    completedQty: decimal('completed_qty', { precision: 15, scale: 6 }).default(
      '0'
    ),
    operationName: varchar('operation_name', { length: 255 }),
    workstationId: uuid('workstation_id'),
    isCompleted: boolean('is_completed').default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workOrderIdIdx: index('idx_work_order_time_logs_work_order_id').on(
      table.workOrderId
    ),
    operationIdIdx: index('idx_work_order_time_logs_operation_id').on(
      table.operationId
    ),
    employeeIdIdx: index('idx_work_order_time_logs_employee_id').on(
      table.employeeId
    ),
    fromTimeIdx: index('idx_work_order_time_logs_from_time').on(table.fromTime),
    workOrderFk: foreignKey({
      columns: [table.workOrderId],
      foreignColumns: [workOrders.id],
    }),
    operationFk: foreignKey({
      columns: [table.operationId],
      foreignColumns: [workOrderOperations.id],
    }),
    workstationFk: foreignKey({
      columns: [table.workstationId],
      foreignColumns: [workstations.id],
    }),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }),
  })
);

// Work Order Relations
export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  company: one(companies, {
    fields: [workOrders.companyId],
    references: [companies.id],
  }),
  item: one(items, {
    fields: [workOrders.itemId],
    references: [items.id],
  }),
  bom: one(boms, {
    fields: [workOrders.bomId],
    references: [boms.id],
  }),
  warehouse: one(warehouses, {
    fields: [workOrders.warehouseId],
    references: [warehouses.id],
  }),
  createdBy: one(users, {
    fields: [workOrders.createdBy],
    references: [users.id],
  }),
  operations: many(workOrderOperations),
  items: many(workOrderItems),
  stockEntries: many(workOrderStockEntries),
  timeLogs: many(workOrderTimeLogs),
}));

export const workOrderOperationsRelations = relations(
  workOrderOperations,
  ({ one, many }) => ({
    workOrder: one(workOrders, {
      fields: [workOrderOperations.workOrderId],
      references: [workOrders.id],
    }),
    workstation: one(workstations, {
      fields: [workOrderOperations.workstationId],
      references: [workstations.id],
    }),
    timeLogs: many(workOrderTimeLogs),
  })
);

export const workOrderItemsRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderItems.workOrderId],
    references: [workOrders.id],
  }),
  item: one(items, {
    fields: [workOrderItems.itemId],
    references: [items.id],
  }),
  sourceWarehouse: one(warehouses, {
    fields: [workOrderItems.sourceWarehouseId],
    references: [warehouses.id],
  }),
}));

export const workOrderStockEntriesRelations = relations(
  workOrderStockEntries,
  ({ one }) => ({
    workOrder: one(workOrders, {
      fields: [workOrderStockEntries.workOrderId],
      references: [workOrders.id],
    }),
    createdBy: one(users, {
      fields: [workOrderStockEntries.createdBy],
      references: [users.id],
    }),
  })
);

export const workOrderTimeLogsRelations = relations(
  workOrderTimeLogs,
  ({ one }) => ({
    workOrder: one(workOrders, {
      fields: [workOrderTimeLogs.workOrderId],
      references: [workOrders.id],
    }),
    operation: one(workOrderOperations, {
      fields: [workOrderTimeLogs.operationId],
      references: [workOrderOperations.id],
    }),
    workstation: one(workstations, {
      fields: [workOrderTimeLogs.workstationId],
      references: [workstations.id],
    }),
    createdBy: one(users, {
      fields: [workOrderTimeLogs.createdBy],
      references: [users.id],
    }),
  })
);

