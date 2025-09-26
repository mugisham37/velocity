-- Migration: 0007_serial_batch_tracking.sql
-- Description: Create comprehensive serial number and batch tracking tables

-- Serial Numbers table for individual item tracking
CREATE TABLE IF NOT EXISTS "serial_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"status" varchar(50) DEFAULT 'Available' NOT NULL, -- Available, Reserved, Sold, Damaged, Lost, Returned
	"condition" varchar(50) DEFAULT 'Good' NOT NULL, -- Good, Damaged, Refurbished, New
	"purchase_date" timestamp,
	"purchase_rate" numeric(15,2) DEFAULT '0',
	"supplier_id" uuid,
	"purchase_document_type" varchar(50),
	"purchase_document_number" varchar(50),
	"warranty_expiry_date" timestamp,
	"maintenance_due_date" timestamp,
	"last_maintenance_date" timestamp,
	"delivery_date" timestamp,
	"delivery_document_type" varchar(50),
	"delivery_document_number" varchar(50),
	"customer_id" uuid,
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Batch Numbers table for lot tracking
CREATE TABLE IF NOT EXISTS "batch_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"item_id" uuid NOT NULL,
	"manufacturing_date" timestamp,
	"expiry_date" timestamp,
	"supplier_ch_id" varchar(100),
	"supplier_id" uuid,
	"purchase_document_type" varchar(50),
	"purchase_document_number" varchar(50),
	"manufacturing_location" varchar(255),
	"quality_status" varchar(50) DEFAULT 'Approved' NOT NULL, -- Approved, Rejected, Pending, Quarantine
	"quality_inspection_date" timestamp,
	"quality_inspector" uuid,
	"quality_notes" text,
	"total_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"available_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"reserved_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"consumed_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"uom" varchar(20) NOT NULL,
	"batch_attributes" jsonb, -- Custom attributes like temperature, pH, etc.
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Batch Locations table for tracking batch quantities across locations
CREATE TABLE IF NOT EXISTS "batch_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"reserved_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"last_transaction_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Serial Number History for complete traceability
CREATE TABLE IF NOT EXISTS "serial_number_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL, -- Purchase, Sale, Transfer, Maintenance, Return, Damage
	"transaction_date" timestamp NOT NULL,
	"from_warehouse_id" uuid,
	"to_warehouse_id" uuid,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"from_customer_id" uuid,
	"to_customer_id" uuid,
	"document_type" varchar(50),
	"document_number" varchar(50),
	"document_id" uuid,
	"previous_status" varchar(50),
	"new_status" varchar(50),
	"previous_condition" varchar(50),
	"new_condition" varchar(50),
	"notes" text,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Batch History for lot traceability
CREATE TABLE IF NOT EXISTS "batch_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL, -- Receipt, Issue, Transfer, Adjustment, Expiry, Quality
	"transaction_date" timestamp NOT NULL,
	"warehouse_id" uuid,
	"location_id" uuid,
	"qty_change" numeric(15,2) DEFAULT '0' NOT NULL,
	"qty_before" numeric(15,2) DEFAULT '0' NOT NULL,
	"qty_after" numeric(15,2) DEFAULT '0' NOT NULL,
	"document_type" varchar(50),
	"document_number" varchar(50),
	"document_id" uuid,
	"reason" varchar(100),
	"notes" text,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Recall Management for tracking product recalls
CREATE TABLE IF NOT EXISTS "product_recalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recall_number" varchar(50) NOT NULL,
	"recall_title" varchar(255) NOT NULL,
	"recall_type" varchar(50) NOT NULL, -- Voluntary, Mandatory, Precautionary
	"severity_level" varchar(50) NOT NULL, -- Critical, High, Medium, Low
	"recall_reason" text NOT NULL,
	"recall_date" timestamp NOT NULL,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"status" varchar(50) DEFAULT 'Active' NOT NULL, -- Active, Completed, Cancelled
	"regulatory_body" varchar(255),
	"regulatory_reference" varchar(100),
	"affected_items" jsonb NOT NULL, -- Array of item IDs
	"affected_batches" jsonb, -- Array of batch numbers/patterns
	"affected_serials" jsonb, -- Array of serial number patterns
	"date_range_from" timestamp,
	"date_range_to" timestamp,
	"customer_notification_required" boolean DEFAULT true NOT NULL,
	"supplier_notification_required" boolean DEFAULT false NOT NULL,
	"recall_instructions" text,
	"contact_information" jsonb,
	"total_affected_qty" numeric(15,2) DEFAULT '0',
	"recovered_qty" numeric(15,2) DEFAULT '0',
	"destroyed_qty" numeric(15,2) DEFAULT '0',
	"returned_qty" numeric(15,2) DEFAULT '0',
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Recall Items for tracking specific affected items
CREATE TABLE IF NOT EXISTS "recall_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recall_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"serial_number_id" uuid,
	"customer_id" uuid,
	"warehouse_id" uuid,
	"location_id" uuid,
	"qty_affected" numeric(15,2) DEFAULT '0',
	"qty_recovered" numeric(15,2) DEFAULT '0',
	"recovery_status" varchar(50) DEFAULT 'Pending' NOT NULL, -- Pending, Recovered, Destroyed, Customer_Notified
	"recovery_date" timestamp,
	"recovery_method" varchar(50), -- Return, Destroy, Repair, Exchange
	"customer_notified" boolean DEFAULT false NOT NULL,
	"notification_date" timestamp,
	"notification_method" varchar(50), -- Email, Phone, Letter, SMS
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Quality Control Integration
CREATE TABLE IF NOT EXISTS "quality_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_number" varchar(50) NOT NULL,
	"inspection_type" varchar(50) NOT NULL, -- Incoming, In-Process, Final, Random
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"serial_number_id" uuid,
	"inspection_date" timestamp NOT NULL,
	"inspector_id" uuid NOT NULL,
	"inspection_template" varchar(100),
	"sample_size" numeric(15,2),
	"total_qty_inspected" numeric(15,2),
	"passed_qty" numeric(15,2) DEFAULT '0',
	"failed_qty" numeric(15,2) DEFAULT '0',
	"overall_status" varchar(50) DEFAULT 'Pending' NOT NULL, -- Pending, Passed, Failed, Conditional
	"inspection_results" jsonb, -- Detailed test results
	"defects_found" jsonb, -- Array of defect types and quantities
	"corrective_actions" text,
	"inspector_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"warehouse_id" uuid,
	"location_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Compliance Reporting for regulated industries
CREATE TABLE IF NOT EXISTS "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_number" varchar(50) NOT NULL,
	"report_type" varchar(50) NOT NULL, -- FDA, EU_MDR, ISO, Custom
	"report_title" varchar(255) NOT NULL,
	"reporting_period_from" timestamp NOT NULL,
	"reporting_period_to" timestamp NOT NULL,
	"regulatory_body" varchar(255),
	"regulation_reference" varchar(100),
	"report_data" jsonb NOT NULL, -- Structured report data
	"affected_items" jsonb, -- Array of item IDs
	"affected_batches" jsonb, -- Array of batch IDs
	"affected_serials" jsonb, -- Array of serial number IDs
	"status" varchar(50) DEFAULT 'Draft' NOT NULL, -- Draft, Submitted, Approved, Rejected
	"submission_date" timestamp,
	"submission_reference" varchar(100),
	"response_date" timestamp,
	"response_status" varchar(50),
	"response_notes" text,
	"generated_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_quality_inspector_users_id_fk" FOREIGN KEY ("quality_inspector") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_customer_id_customers_id_fk" FOREIGN KEY ("from_customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_customer_id_customers_id_fk" FOREIGN KEY ("to_customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_recall_id_product_recalls_id_fk" FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS "serial_numbers_unique" ON "serial_numbers" ("serial_number","company_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_item_idx" ON "serial_numbers" ("item_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_warehouse_idx" ON "serial_numbers" ("warehouse_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_location_idx" ON "serial_numbers" ("location_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_status_idx" ON "serial_numbers" ("status");
CREATE INDEX IF NOT EXISTS "serial_numbers_condition_idx" ON "serial_numbers" ("condition");
CREATE INDEX IF NOT EXISTS "serial_numbers_customer_idx" ON "serial_numbers" ("customer_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_supplier_idx" ON "serial_numbers" ("supplier_id");
CREATE INDEX IF NOT EXISTS "serial_numbers_warranty_idx" ON "serial_numbers" ("warranty_expiry_date");
CREATE INDEX IF NOT EXISTS "serial_numbers_company_idx" ON "serial_numbers" ("company_id");

CREATE UNIQUE INDEX IF NOT EXISTS "batch_numbers_unique" ON "batch_numbers" ("batch_number","item_id","company_id");
CREATE INDEX IF NOT EXISTS "batch_numbers_item_idx" ON "batch_numbers" ("item_id");
CREATE INDEX IF NOT EXISTS "batch_numbers_expiry_idx" ON "batch_numbers" ("expiry_date");
CREATE INDEX IF NOT EXISTS "batch_numbers_manufacturing_idx" ON "batch_numbers" ("manufacturing_date");
CREATE INDEX IF NOT EXISTS "batch_numbers_quality_status_idx" ON "batch_numbers" ("quality_status");
CREATE INDEX IF NOT EXISTS "batch_numbers_supplier_idx" ON "batch_numbers" ("supplier_id");
CREATE INDEX IF NOT EXISTS "batch_numbers_active_idx" ON "batch_numbers" ("is_active");
CREATE INDEX IF NOT EXISTS "batch_numbers_company_idx" ON "batch_numbers" ("company_id");

CREATE UNIQUE INDEX IF NOT EXISTS "batch_locations_unique" ON "batch_locations" ("batch_id","warehouse_id","location_id");
CREATE INDEX IF NOT EXISTS "batch_locations_batch_idx" ON "batch_locations" ("batch_id");
CREATE INDEX IF NOT EXISTS "batch_locations_warehouse_idx" ON "batch_locations" ("warehouse_id");
CREATE INDEX IF NOT EXISTS "batch_locations_location_idx" ON "batch_locations" ("location_id");

CREATE INDEX IF NOT EXISTS "serial_number_history_serial_idx" ON "serial_number_history" ("serial_number_id");
CREATE INDEX IF NOT EXISTS "serial_number_history_transaction_idx" ON "serial_number_history" ("transaction_type");
CREATE INDEX IF NOT EXISTS "serial_number_history_date_idx" ON "serial_number_history" ("transaction_date");
CREATE INDEX IF NOT EXISTS "serial_number_history_document_idx" ON "serial_number_history" ("document_type","document_number");
CREATE INDEX IF NOT EXISTS "serial_number_history_company_idx" ON "serial_number_history" ("company_id");

CREATE INDEX IF NOT EXISTS "batch_history_batch_idx" ON "batch_history" ("batch_id");
CREATE INDEX IF NOT EXISTS "batch_history_transaction_idx" ON "batch_history" ("transaction_type");
CREATE INDEX IF NOT EXISTS "batch_history_date_idx" ON "batch_history" ("transaction_date");
CREATE INDEX IF NOT EXISTS "batch_history_warehouse_idx" ON "batch_history" ("warehouse_id");
CREATE INDEX IF NOT EXISTS "batch_history_document_idx" ON "batch_history" ("document_type","document_number");
CREATE INDEX IF NOT EXISTS "batch_history_company_idx" ON "batch_history" ("company_id");

CREATE UNIQUE INDEX IF NOT EXISTS "product_recalls_number_company_unique" ON "product_recalls" ("recall_number","company_id");
CREATE INDEX IF NOT EXISTS "product_recalls_type_idx" ON "product_recalls" ("recall_type");
CREATE INDEX IF NOT EXISTS "product_recalls_severity_idx" ON "product_recalls" ("severity_level");
CREATE INDEX IF NOT EXISTS "product_recalls_status_idx" ON "product_recalls" ("status");
CREATE INDEX IF NOT EXISTS "product_recalls_date_idx" ON "product_recalls" ("recall_date");
CREATE INDEX IF NOT EXISTS "product_recalls_effective_idx" ON "product_recalls" ("effective_date");
CREATE INDEX IF NOT EXISTS "product_recalls_company_idx" ON "product_recalls" ("company_id");

CREATE INDEX IF NOT EXISTS "recall_items_recall_idx" ON "recall_items" ("recall_id");
CREATE INDEX IF NOT EXISTS "recall_items_item_idx" ON "recall_items" ("item_id");
CREATE INDEX IF NOT EXISTS "recall_items_batch_idx" ON "recall_items" ("batch_id");
CREATE INDEX IF NOT EXISTS "recall_items_serial_idx" ON "recall_items" ("serial_number_id");
CREATE INDEX IF NOT EXISTS "recall_items_customer_idx" ON "recall_items" ("customer_id");
CREATE INDEX IF NOT EXISTS "recall_items_status_idx" ON "recall_items" ("recovery_status");

CREATE UNIQUE INDEX IF NOT EXISTS "quality_inspections_number_company_unique" ON "quality_inspections" ("inspection_number","company_id");
CREATE INDEX IF NOT EXISTS "quality_inspections_item_idx" ON "quality_inspections" ("item_id");
CREATE INDEX IF NOT EXISTS "quality_inspections_batch_idx" ON "quality_inspections" ("batch_id");
CREATE INDEX IF NOT EXISTS "quality_inspections_serial_idx" ON "quality_inspections" ("serial_number_id");
CREATE INDEX IF NOT EXISTS "quality_inspections_type_idx" ON "quality_inspections" ("inspection_type");
CREATE INDEX IF NOT EXISTS "quality_inspections_status_idx" ON "quality_inspections" ("overall_status");
CREATE INDEX IF NOT EXISTS "quality_inspections_date_idx" ON "quality_inspections" ("inspection_date");
CREATE INDEX IF NOT EXISTS "quality_inspections_inspector_idx" ON "quality_inspections" ("inspector_id");
CREATE INDEX IF NOT EXISTS "quality_inspections_company_idx" ON "quality_inspections" ("company_id");

CREATE UNIQUE INDEX IF NOT EXISTS "compliance_reports_number_company_unique" ON "compliance_reports" ("report_number","company_id");
CREATE INDEX IF NOT EXISTS "compliance_reports_type_idx" ON "compliance_reports" ("report_type");
CREATE INDEX IF NOT EXISTS "compliance_reports_status_idx" ON "compliance_reports" ("status");
CREATE INDEX IF NOT EXISTS "compliance_reports_period_idx" ON "compliance_reports" ("reporting_period_from","reporting_period_to");
CREATE INDEX IF NOT EXISTS "compliance_reports_submission_idx" ON "compliance_reports" ("submission_date");
CREATE INDEX IF NOT EXISTS "compliance_reports_company_idx" ON "compliance_reports" ("company_id");

-- Add comments for documentation
COMMENT ON TABLE "serial_numbers" IS 'Individual serial number tracking for items throughout supply chain';
COMMENT ON TABLE "batch_numbers" IS 'Batch/lot tracking with expiry dates and quality management';
COMMENT ON TABLE "batch_locations" IS 'Batch quantity distribution across warehouse locations';
COMMENT ON TABLE "serial_number_history" IS 'Complete traceability history for serial numbers';
COMMENT ON TABLE "batch_history" IS 'Complete traceability history for batches';
COMMENT ON TABLE "product_recalls" IS 'Product recall management for affected items';
COMMENT ON TABLE "recall_items" IS 'Specific items affected by product recalls';
COMMENT ON TABLE "quality_inspections" IS 'Quality control inspections for batches and serial numbers';
COMMENT ON TABLE "compliance_reports" IS 'Regulatory compliance reporting for various standards';

COMMENT ON COLUMN "serial_numbers"."status" IS 'Available, Reserved, Sold, Damaged, Lost, Returned';
COMMENT ON COLUMN "serial_numbers"."condition" IS 'Good, Damaged, Refurbished, New';
COMMENT ON COLUMN "batch_numbers"."quality_status" IS 'Approved, Rejected, Pending, Quarantine';
COMMENT ON COLUMN "product_recalls"."recall_type" IS 'Voluntary, Mandatory, Precautionary';
COMMENT ON COLUMN "product_recalls"."severity_level" IS 'Critical, High, Medium, Low';
COMMENT ON COLUMN "quality_inspections"."inspection_type" IS 'Incoming, In-Process, Final, Random';
COMMENT ON COLUMN "quality_inspections"."overall_status" IS 'Pending, Passed, Failed, Conditional';
COMMENT ON COLUMN "compliance_reports"."report_type" IS 'FDA, EU_MDR, ISO, Custom';
