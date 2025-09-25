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

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemCode: varchar('item_code', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    itemGroup: varchar('item_group', { length: 100 }),
    categoryId: uuid('category_id').references(() => itemCategories.id),
    description: text('description'),

    // Item Classification
    itemType: varchar('item_type', { length: 50 }).default('Stock'), // Stock, Service, Non-Stock
    hasVariants: boolean('has_variants').default(false).notNull(),
    templateItemId: uuid('template_item_id'),

    // Lifecycle Management
    currentStage: varchar('current_stage', { length: 50 }).default(
      'Introduction'
    ), // Introduction, Growth, Maturity, Decline, Discontinuation
    discontinuedDate: timestamp('discontinued_date'),
    replacementItemId: uuid('replacement_item_id'),

    // Units and Measurements
    stockUom: varchar('stock_uom', { length: 20 }).notNull(),
    salesUom: varchar('sales_uom', { length: 20 }),
    purchaseUom: varchar('purchase_uom', { length: 20 }),

    // Unit Conversion Factors
    salesUomConversionFactor: decimal('sales_uom_conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),
    purchaseUomConversionFactor: decimal('purchase_uom_conversion_factor', {
      precision: 15,
      scale: 6,
    }).default('1'),

    // Pricing
    standardRate: decimal('standard_rate', { precision: 15, scale: 2 }).default(
      '0'
    ),
    valuationRate: decimal('valuation_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),
    lastPurchaseRate: decimal('last_purchase_rate', {
      precision: 15,
      scale: 2,
    }).default('0'),

    // Inventory Settings
    isStockItem: boolean('is_stock_item').default(true).notNull(),
    hasSerialNo: boolean('has_serial_no').default(false).notNull(),
    hasBatchNo: boolean('has_batch_no').default(false).notNull(),
    hasExpiryDate: boolean('has_expiry_date').default(false).notNull(),

    // Quality Control
    inspectionRequired: boolean('inspection_required').default(false).notNull(),
    qualityInspectionTemplate: varchar('quality_inspection_template', {
      length: 100,
    }),

    // Reorder Settings
    reorderLevel: decimal('reorder_level', { precision: 15, scale: 2 }).default(
      '0'
    ),
    reorderQty: decimal('reorder_qty', { precision: 15, scale: 2 }).default(
      '0'
    ),
    minOrderQty: decimal('min_order_qty', { precision: 15, scale: 2 }).default(
      '1'
    ),
    maxOrderQty: decimal('max_order_qty', { precision: 15, scale: 2 }),

    // Lead Times
    leadTimeDays: integer('lead_time_days').default(0),

    // Physical Properties
    weight: decimal('weight', { precision: 15, scale: 3 }),
    weightUom: varchar('weight_uom', { length: 20 }),
    length: decimal('length', { precision: 15, scale: 3 }),
    width: decimal('width', { precision: 15, scale: 3 }),
    height: decimal('height', { precision: 15, scale: 3 }),
    dimensionUom: varchar('dimension_uom', { length: 20 }),

    // Tax and Accounting
    taxCategory: varchar('tax_category', { length: 100 }),
    incomeAccount: varchar('income_account', { length: 100 }),
    expenseAccount: varchar('expense_account', { length: 100 }),
    costOfGoodsSoldAccount: varchar('cogs_account', { length: 100 }),
    assetAccount: varchar('asset_account', { length: 100 }),

    // Additional Information
    brand: varchar('brand', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 100 }),
    manufacturerPartNo: varchar('manufacturer_part_no', { length: 100 }),
    countryOfOrigin: varchar('country_of_origin', { length: 3 }),
    hsCode: varchar('hs_code', { length: 20 }), // Harmonized System Code

    // Barcodes
    barcode: varchar('barcode', { length: 100 }),
    barcodeType: varchar('barcode_type', { length: 20 }), // EAN, UPC, Code128, etc.

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    isSalesItem: boolean('is_sales_item').default(true).notNull(),
    isPurchaseItem: boolean('is_purchase_item').default(true).notNull(),
    isFixedAsset: boolean('is_fixed_asset').default(false).notNull(),

    // Audit Fields
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemCodeIdx: unique('items_code_company_unique').on(
      table.itemCode,
      table.companyId
    ),
    categoryIdx: index('items_category_idx').on(table.categoryId),
    typeIdx: index('items_type_idx').on(table.itemType),
    stageIdx: index('items_stage_idx').on(table.currentStage),
    barcodeIdx: index('items_barcode_idx').on(table.barcode),
    brandIdx: index('items_brand_idx').on(table.brand),
    manufacturerIdx: index('items_manufacturer_idx').on(table.manufacturer),
    companyIdx: index('items_company_idx').on(table.companyId),
  })
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  category: one(itemCategories, {
    fields: [items.categoryId],
    references: [itemCategories.id],
  }),
  templateItem: one(items, {
    fields: [items.templateItemId],
    references: [items.id],
  }),
  replacementItem: one(items, {
    fields: [items.replacementItemId],
    references: [items.id],
  }),
  creator: one(users, {
    fields: [items.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [items.updatedBy],
    references: [users.id],
  }),
  variants: many(items),
  prices: many(itemPrices),
  pricingTiers: many(itemPricingTiers),
  stockLevels: many(stockLevels),
  attributeValues: many(itemAttributeValues),
  itemVariants: many(itemVariants, { relationName: 'templateVariants' }),
  variantItems: many(itemVariants, { relationName: 'variantItems' }),
  crossReferences: many(itemCrossReferences, {
    relationName: 'itemReferences',
  }),
  referencedBy: many(itemCrossReferences, { relationName: 'referencedItems' }),
  documents: many(itemDocuments),
  lifecycle: many(itemLifecycle),
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

// Item Categories for hierarchical organization
export const itemCategories = pgTable(
  'item_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryCode: varchar('category_code', { length: 50 }).notNull(),
    categoryName: varchar('category_name', { length: 255 }).notNull(),
    parentCategoryId: uuid('parent_category_id'),
    description: text('description'),
    isGroup: boolean('is_group').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    categoryCodeIdx: index('item_categories_code_idx').on(table.categoryCode),
    companyIdx: index('item_categories_company_idx').on(table.companyId),
  })
);

export const itemCategoriesRelations = relations(
  itemCategories,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [itemCategories.companyId],
      references: [companies.id],
    }),
    parentCategory: one(itemCategories, {
      fields: [itemCategories.parentCategoryId],
      references: [itemCategories.id],
    }),
    childCategories: many(itemCategories),
    items: many(items),
  })
);

// Item Attributes for custom properties
export const itemAttributes = pgTable(
  'item_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attributeName: varchar('attribute_name', { length: 100 }).notNull(),
    attributeType: varchar('attribute_type', { length: 50 }).notNull(), // Text, Number, Date, Boolean, Select
    isRequired: boolean('is_required').default(false).notNull(),
    defaultValue: text('default_value'),
    selectOptions: jsonb('select_options'), // For select type attributes
    validationRules: jsonb('validation_rules'),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    nameIdx: index('item_attributes_name_idx').on(table.attributeName),
    companyIdx: index('item_attributes_company_idx').on(table.companyId),
  })
);

export const itemAttributesRelations = relations(
  itemAttributes,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [itemAttributes.companyId],
      references: [companies.id],
    }),
    itemAttributeValues: many(itemAttributeValues),
  })
);

// Item Attribute Values for storing actual attribute values
export const itemAttributeValues = pgTable(
  'item_attribute_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    attributeId: uuid('attribute_id')
      .references(() => itemAttributes.id, { onDelete: 'cascade' })
      .notNull(),
    value: text('value'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemAttributeIdx: unique('item_attribute_unique').on(
      table.itemId,
      table.attributeId
    ),
    itemIdx: index('item_attribute_values_item_idx').on(table.itemId),
    attributeIdx: index('item_attribute_values_attribute_idx').on(
      table.attributeId
    ),
  })
);

export const itemAttributeValuesRelations = relations(
  itemAttributeValues,
  ({ one }) => ({
    item: one(items, {
      fields: [itemAttributeValues.itemId],
      references: [items.id],
    }),
    attribute: one(itemAttributes, {
      fields: [itemAttributeValues.attributeId],
      references: [itemAttributes.id],
    }),
  })
);

// Item Variants for matrix-based configuration
export const itemVariants = pgTable(
  'item_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateItemId: uuid('template_item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    variantItemId: uuid('variant_item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    variantAttributes: jsonb('variant_attributes').notNull(), // Key-value pairs for variant attributes
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    templateIdx: index('item_variants_template_idx').on(table.templateItemId),
    variantIdx: index('item_variants_variant_idx').on(table.variantItemId),
  })
);

export const itemVariantsRelations = relations(itemVariants, ({ one }) => ({
  templateItem: one(items, {
    fields: [itemVariants.templateItemId],
    references: [items.id],
  }),
  variantItem: one(items, {
    fields: [itemVariants.variantItemId],
    references: [items.id],
  }),
}));

// Item Cross References for substitute and alternative items
export const itemCrossReferences = pgTable(
  'item_cross_references',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    referenceItemId: uuid('reference_item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // Substitute, Alternative, Accessory, Related
    priority: integer('priority').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemIdx: index('item_cross_references_item_idx').on(table.itemId),
    referenceIdx: index('item_cross_references_reference_idx').on(
      table.referenceItemId
    ),
    typeIdx: index('item_cross_references_type_idx').on(table.referenceType),
  })
);

export const itemCrossReferencesRelations = relations(
  itemCrossReferences,
  ({ one }) => ({
    item: one(items, {
      fields: [itemCrossReferences.itemId],
      references: [items.id],
    }),
    referenceItem: one(items, {
      fields: [itemCrossReferences.referenceItemId],
      references: [items.id],
    }),
  })
);

// Item Images and Documents
export const itemDocuments = pgTable(
  'item_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(), // Image, PDF, Video, Manual, Certificate
    fileName: varchar('file_name', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    version: integer('version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(), // Primary image/document
    description: text('description'),
    uploadedBy: uuid('uploaded_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemIdx: index('item_documents_item_idx').on(table.itemId),
    typeIdx: index('item_documents_type_idx').on(table.documentType),
    primaryIdx: index('item_documents_primary_idx').on(
      table.itemId,
      table.isPrimary
    ),
  })
);

export const itemDocumentsRelations = relations(itemDocuments, ({ one }) => ({
  item: one(items, {
    fields: [itemDocuments.itemId],
    references: [items.id],
  }),
  uploader: one(users, {
    fields: [itemDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// Item Lifecycle Management
export const itemLifecycle = pgTable(
  'item_lifecycle',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    stage: varchar('stage', { length: 50 }).notNull(), // Introduction, Growth, Maturity, Decline, Discontinuation
    effectiveDate: timestamp('effective_date').notNull(),
    reason: text('reason'),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    itemIdx: index('item_lifecycle_item_idx').on(table.itemId),
    stageIdx: index('item_lifecycle_stage_idx').on(table.stage),
    dateIdx: index('item_lifecycle_date_idx').on(table.effectiveDate),
  })
);

export const itemLifecycleRelations = relations(itemLifecycle, ({ one }) => ({
  item: one(items, {
    fields: [itemLifecycle.itemId],
    references: [items.id],
  }),
  creator: one(users, {
    fields: [itemLifecycle.createdBy],
    references: [users.id],
  }),
}));

// Enhanced Item Pricing with customer-specific and volume-based pricing
export const itemPricingTiers = pgTable(
  'item_pricing_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    priceList: varchar('price_list', { length: 100 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    customerId: uuid('customer_id'), // For customer-specific pricing
    minQty: decimal('min_qty', { precision: 15, scale: 2 })
      .default('0')
      .notNull(),
    maxQty: decimal('max_qty', { precision: 15, scale: 2 }),
    rate: decimal('rate', { precision: 15, scale: 2 }).notNull(),
    discountPercent: decimal('discount_percent', {
      precision: 5,
      scale: 2,
    }).default('0'),
    validFrom: timestamp('valid_from').notNull(),
    validUpto: timestamp('valid_upto'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    itemIdx: index('item_pricing_tiers_item_idx').on(table.itemId),
    priceListIdx: index('item_pricing_tiers_price_list_idx').on(
      table.priceList
    ),
    customerIdx: index('item_pricing_tiers_customer_idx').on(table.customerId),
    validityIdx: index('item_pricing_tiers_validity_idx').on(
      table.validFrom,
      table.validUpto
    ),
  })
);

export const itemPricingTiersRelations = relations(
  itemPricingTiers,
  ({ one }) => ({
    item: one(items, {
      fields: [itemPricingTiers.itemId],
      references: [items.id],
    }),
    customer: one(customers, {
      fields: [itemPricingTiers.customerId],
      references: [customers.id],
    }),
  })
);

// Import warehouses and users for relations
import { customers } from './customers';
import { users } from './users';
import { warehouses } from './warehouses';
