import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemCode: varchar('item_code', { length: 50 }).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  itemGroup: varchar('item_group', { length: 100 }),
  description: text('description'),

  // Item Classification
  itemType: varchar('item_type', { length: 50 }).default('Stock'), // Stock, Service, Non-Stock
  hasVariants: boolean('has_variants').default(false).notNull(),
  templateItemId: uuid('template_item_id'),

  // Units and Measurements
  stockUom: varchar('stock_uom', { length: 20 }).notNull(),
  salesUom: varchar('sales_uom', { length: 20 }),
  purchaseUom: varchar('purchase_uom', { length: 20 }),

  // Pricing
  standardRate: decimal('standard_rate', { precision: 15, scale: 2 }).default(
    '0'
  ),
  valuationRate: decimal('valuation_rate', { precision: 15, scale: 2 }).default(
    '0'
  ),

  // Inventory Settings
  isStockItem: boolean('is_stock_item').default(true).notNull(),
  hasSerialNo: boolean('has_serial_no').default(false).notNull(),
  hasBatchNo: boolean('has_batch_no').default(false).notNull(),
  hasExpiryDate: boolean('has_expiry_date').default(false).notNull(),

  // Reorder Settings
  reorderLevel: decimal('reorder_level', { precision: 15, scale: 2 }).default(
    '0'
  ),
  reorderQty: decimal('reorder_qty', { precision: 15, scale: 2 }).default('0'),
  minOrderQty: decimal('min_order_qty', { precision: 15, scale: 2 }).default(
    '1'
  ),

  // Tax and Accounting
  taxCategory: varchar('tax_category', { length: 100 }),
  incomeAccount: varchar('income_account', { length: 100 }),
  expenseAccount: varchar('expense_account', { length: 100 }),

  // Additional Information
  brand: varchar('brand', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  countryOfOrigin: varchar('country_of_origin', { length: 3 }),
  customAttributes: jsonb('custom_attributes'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isSalesItem: boolean('is_sales_item').default(true).notNull(),
  isPurchaseItem: boolean('is_purchase_item').default(true).notNull(),

  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  templateItem: one(items, {
    fields: [items.templateItemId],
    references: [items.id],
  }),
  variants: many(items),
  prices: many(itemPrices),
  stockLevels: many(stockLevels),
}));

export const itemPrices = pgTable('item_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id')
    .references(() => items.id)
    .notNull(),
  priceList: varchar('price_list', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  rate: decimal('rate', { precision: 15, scale: 2 }).notNull(),
  validFrom: timestamp('valid_from'),
  validUpto: timestamp('valid_upto'),
  minQty: decimal('min_qty', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itemPricesRelations = relations(itemPrices, ({ one }) => ({
  item: one(items, {
    fields: [itemPrices.itemId],
    references: [items.id],
  }),
}));

export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id')
    .references(() => items.id)
    .notNull(),
  warehouseId: uuid('warehouse_id')
    .references(() => warehouses.id)
    .notNull(),
  actualQty: decimal('actual_qty', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  reservedQty: decimal('reserved_qty', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  orderedQty: decimal('ordered_qty', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  plannedQty: decimal('planned_qty', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  valuationRate: decimal('valuation_rate', { precision: 15, scale: 2 }).default(
    '0'
  ),
  stockValue: decimal('stock_value', { precision: 15, scale: 2 }).default('0'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  item: one(items, {
    fields: [stockLevels.itemId],
    references: [items.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockLevels.warehouseId],
    references: [warehouses.id],
  }),
  company: one(companies, {
    fields: [stockLevels.companyId],
    references: [companies.id],
  }),
}));

// Import warehouses for relations
import { warehouses } from './warehouses';
