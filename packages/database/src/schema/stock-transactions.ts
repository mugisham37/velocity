import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';
import { items } from './items';
import { warehouses, warehouseLocations } from './warehouses';

// Stock Entries for all stock transactions
export const stockEntries = pgTable('stock_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryNumber: varchar('entry_number', { length: 50 }).notNull(),
  entryType: varchar('entry_type', { length: 50 }).notNull(), // Receipt, Issue, Transfer, Adjustment, Opening, Closing

  // Reference Information
  refe
