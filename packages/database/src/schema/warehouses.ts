import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseCode: varchar('warehouse_code', { length: 50 }).notNull(),
  warehouseName: varchar('warehouse_name', { length: 255 }).notNull(),
  warehouseType: varchar('warehouse_type', { length: 50 }).default('Stock'), // Stock, Transit, Sample
  parentWarehouseId: uuid('parent_warehouse_id'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  
  // Address Information
  address: jsonb('address'),
  
  // Contact Information
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Settings
  isGroup: boolean('is_group').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
}));

export const warehouseLocations = pgTable('warehouse_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id).notNull(),
  locationCode: varchar('location_code', { length: 50 }).notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  parentLocationId: uuid('parent_location_id'),
  
  // Location Details
  aisle: varchar('aisle', { length: 20 }),
  rack: varchar('rack', { length: 20 }),
  shelf: varchar('shelf', { length: 20 }),
  bin: varchar('bin', { length: 20 }),
  
  // Settings
  isGroup: boolean('is_group').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const warehouseLocationsRelations = relations(warehouseLocations, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseLocations.warehouseId],
    references: [warehouses.id],
  }),
  parentLocation: one(warehouseLocations, {
    fields: [warehouseLocations.parentLocationId],
    references: [warehouseLocations.id],
  }),
  childLocations: many(warehouseLocations),
}));