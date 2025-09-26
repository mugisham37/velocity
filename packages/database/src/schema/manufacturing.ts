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
  })
);
