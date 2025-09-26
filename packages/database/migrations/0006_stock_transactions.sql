-- Stock Transactions Migration
-- This migration creates tables for stock transaction processing

-- Stock Entries table for all stock transactions
CREATE TABLE IF NOT EXISTS "stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"entry_type" varchar(50) NOT NULL,
	"reference_type" varchar(50),
	"reference_number" varchar(50),
	"reference_id" uuid,
	"transaction_date" timestamp NOT NULL,
	"posting_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"from_warehouse_id" uuid,
	"to_warehouse_id" uuid,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"doc_status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"total_value" numeric(15,2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"purpose" varchar(100),
	"remarks" text,
	"is_gl_posted" boolean DEFAULT false NOT NULL,
	"gl_posting_date" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Entry Items table for detailed item-level transaction information
CREATE TABLE IF NOT EXISTS "stock_entry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_entry_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"qty" numeric(15,2) NOT NULL,
	"uom" varchar(20) NOT NULL,
	"conversion_factor" numeric(15,6) DEFAULT '1',
	"stock_uom_qty" numeric(15,2) NOT NULL,
	"valuation_rate" numeric(15,2) DEFAULT '0',
	"amount" numeric(15,2) DEFAULT '0',
	"serial_numbers" jsonb,
	"batch_numbers" jsonb,
	"has_serial_no" boolean DEFAULT false NOT NULL,
	"has_batch_no" boolean DEFAULT false NOT NULL,
	"quality_inspection" varchar(100),
	"inspection_required" boolean DEFAULT false NOT NULL,
	"quality_status" varchar(50) DEFAULT 'Accepted',
	"remarks" text,
	"actual_qty_before" numeric(15,2) DEFAULT '0',
	"actual_qty_after" numeric(15,2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Ledger Entries for maintaining stock movement history
CREATE TABLE IF NOT EXISTS "stock_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"voucher_type" varchar(50) NOT NULL,
	"voucher_number" varchar(50) NOT NULL,
	"voucher_id" uuid NOT NULL,
	"posting_date" timestamp NOT NULL,
	"posting_time" timestamp NOT NULL,
	"actual_qty" numeric(15,2) DEFAULT '0',
	"qty_after_transaction" numeric(15,2) DEFAULT '0',
	"incoming_rate" numeric(15,2) DEFAULT '0',
	"valuation_rate" numeric(15,2) DEFAULT '0',
	"stock_value" numeric(15,2) DEFAULT '0',
	"stock_value_difference" numeric(15,2) DEFAULT '0',
	"serial_nr(100),
	"batch_no" varchar(100),
	"reserved_qty" numeric(15,2) DEFAULT '0',
	"reserved_stock" numeric(15,2) DEFAULT '0',
	"project_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Reservations for sales orders and production
CREATE TABLE IF NOT EXISTS "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"reservation_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_number" varchar(50) NOT NULL,
	"reference_id" uuid NOT NULL,
	"reserved_qty" numeric(15,2) NOT NULL,
	"delivered_qty" numeric(15,2) DEFAULT '0',
	"uom" varchar(20) NOT NULL,
	"serial_numbers" jsonb,
	"batch_numbers" jsonb,
	"reservation_date" timestamp NOT NULL,
	"expected_delivery_date" timestamp,
	"expiry_date" timestamp,
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"remarks" text,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Reconciliations for periodic stock verification
CREATE TABLE IF NOT EXISTS "stock_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reconciliation_number" varchar(50) NOT NULL,
	"reconciliation_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"reconciliation_type" varchar(50) NOT NULL,
	"total_items_count" integer DEFAULT 0,
	"items_with_variance" integer DEFAULT 0,
	"total_variance_value" numeric(15,2) DEFAULT '0',
	"purpose" varchar(100),
	"remarks" text,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Reconciliation Items for detailed item-level reconciliation
CREATE TABLE IF NOT EXISTS "stock_reconciliation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reconciliation_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid,
	"system_qty" numeric(15,2) DEFAULT '0',
	"physical_qty" numeric(15,2) DEFAULT '0',
	"variance_qty" numeric(15,2) DEFAULT '0',
	"valuation_rate" numeric(15,2) DEFAULT '0',
	"variance_value" numeric(15,2) DEFAULT '0',
	"serial_numbers" jsonb,
	"batch_numbers" jsonb,
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"variance_reason" varchar(100),
	"remarks" text,
	"counted_by" uuid,
	"counted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_stock_entry_id_stock_entries_id_fk" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_reconciliation_id_stock_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "stock_reconciliations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "stock_entries_number_company_unique" ON "stock_entries" ("entry_number","company_id");
CREATE INDEX IF NOT EXISTS "stock_entries_type_idx" ON "stock_entries" ("entry_type");
CREATE INDEX IF NOT EXISTS "stock_entries_warehouse_idx" ON "stock_entries" ("warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_entries_status_idx" ON "stock_entries" ("status");
CREATE INDEX IF NOT EXISTS "stock_entries_date_idx" ON "stock_entries" ("transaction_date");
CREATE INDEX IF NOT EXISTS "stock_entries_reference_idx" ON "stock_entries" ("reference_type","reference_number");
CREATE INDEX IF NOT EXISTS "stock_entries_company_idx" ON "stock_entries" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_entry_items_entry_idx" ON "stock_entry_items" ("stock_entry_id");
CREATE INDEX IF NOT EXISTS "stock_entry_items_item_idx" ON "stock_entry_items" ("item_id");
CREATE INDEX IF NOT EXISTS "stock_entry_items_location_idx" ON "stock_entry_items" ("location_id");
CREATE INDEX IF NOT EXISTS "stock_entry_items_batch_idx" ON "stock_entry_items" USING gin ("batch_numbers");

CREATE INDEX IF NOT EXISTS "stock_ledger_item_warehouse_idx" ON "stock_ledger_entries" ("item_id","warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_ledger_voucher_idx" ON "stock_ledger_entries" ("voucher_type","voucher_number");
CREATE INDEX IF NOT EXISTS "stock_ledger_posting_date_idx" ON "stock_ledger_entries" ("posting_date");
CREATE INDEX IF NOT EXISTS "stock_ledger_serial_idx" ON "stock_ledger_entries" ("serial_no");
CREATE INDEX IF NOT EXISTS "stock_ledger_batch_idx" ON "stock_ledger_entries" ("batch_no");
CREATE INDEX IF NOT EXISTS "stock_ledger_company_idx" ON "stock_ledger_entries" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_reservations_item_warehouse_idx" ON "stock_reservations" ("item_id","warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_reference_idx" ON "stock_reservations" ("reference_type","reference_number");
CREATE INDEX IF NOT EXISTS "stock_reservations_status_idx" ON "stock_reservations" ("status");
CREATE INDEX IF NOT EXISTS "stock_reservations_expiry_idx" ON "stock_reservations" ("expiry_date");
CREATE INDEX IF NOT EXISTS "stock_reservations_company_idx" ON "stock_reservations" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_reconciliations_number_company_unique" ON "stock_reconciliations" ("reconciliation_number","company_id");
CREATE INDEX IF NOT EXISTS "stock_reconciliations_warehouse_idx" ON "stock_reconciliations" ("warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_reconciliations_status_idx" ON "stock_reconciliations" ("status");
CREATE INDEX IF NOT EXISTS "stock_reconciliations_date_idx" ON "stock_reconciliations" ("reconciliation_date");
CREATE INDEX IF NOT EXISTS "stock_reconciliations_company_idx" ON "stock_reconciliations" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_reconciliation_idx" ON "stock_reconciliation_items" ("reconciliation_id");
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_item_idx" ON "stock_reconciliation_items" ("item_id");
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_location_idx" ON "stock_reconciliation_items" ("location_id");
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_variance_idx" ON "stock_reconciliation_items" ("variance_qty");

-- Add unique constraints
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_number_company_unique" UNIQUE("entry_number","company_id");
ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_number_company_unique" UNIQUE("reconciliation_number","company_id");
