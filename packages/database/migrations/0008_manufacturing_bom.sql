-- Manufacturing Module: Bill of Materials (BOM) Management
-- Migration: 0008_manufacturing_bom.sql

-- Create workstations table first (referenced by bom_operations)
CREATE TABLE IF NOT EXISTS "workstations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workstation_name" varchar(255) NOT NULL,
	"workstation_type" varchar(100),
	"company_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"description" text,
	"hour_rate" numeric(15,2) DEFAULT '0',
	"hour_rate_electricity" numeric(15,2) DEFAULT '0',
	"hour_rate_consumable" numeric(15,2) DEFAULT '0',
	"hour_rate_rent" numeric(15,2) DEFAULT '0',
	"hour_rate_labour" numeric(15,2) DEFAULT '0',
	"production_capacity" numeric(15,2) DEFAULT '1',
	"working_hours_start" varchar(10),
	"working_hours_end" varchar(10),
	"holiday_list" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOMs t
REATE TABLE IF NOT EXISTS "boms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_no" varchar(50) NOT NULL,
	"item_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"description" text,
	"quantity" numeric(15,6) DEFAULT '1' NOT NULL,
	"uom" varchar(50) NOT NULL,
	"operating_cost" numeric(15,2) DEFAULT '0',
	"raw_material_cost" numeric(15,2) DEFAULT '0',
	"total_cost" numeric(15,2) DEFAULT '0',
	"bom_type" varchar(50) DEFAULT 'Manufacturing' NOT NULL,
	"with_operations" boolean DEFAULT false,
	"transfer_material_against" varchar(50) DEFAULT 'Work Order',
	"allow_alternative_item" boolean DEFAULT false,
	"allow_same_item_multiple_times" boolean DEFAULT false,
	"set_rate_of_sub_assembly_item_based_on_bom" boolean DEFAULT true,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"price_list_rate" numeric(15,2) DEFAULT '0',
	"base_raw_material_cost" numeric(15,2) DEFAULT '0',
	"base_operating_cost" numeric(15,2) DEFAULT '0',
	"base_total_cost" numeric(15,2) DEFAULT '0',
	"inspection_required" boolean DEFAULT false,
	"quality_inspection_template" varchar(255),
	"project_id" uuid,
	"routing_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOM items table
CREATE TABLE IF NOT EXISTS "bom_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"qty" numeric(15,6) NOT NULL,
	"uom" varchar(50) NOT NULL,
	"rate" numeric(15,2) DEFAULT '0',
	"base_rate" numeric(15,2) DEFAULT '0',
	"amount" numeric(15,2) DEFAULT '0',
	"base_amount" numeric(15,2) DEFAULT '0',
	"stock_qty" numeric(15,6) DEFAULT '0',
	"stock_uom" varchar(50),
	"conversion_factor" numeric(15,6) DEFAULT '1',
	"bom_no" varchar(50),
	"allow_alternative_item" boolean DEFAULT false,
	"include_item_in_manufacturing" boolean DEFAULT true,
	"sourced_by_supplier" boolean DEFAULT false,
	"original_item" uuid,
	"operation_id" uuid,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOM operations table
CREATE TABLE IF NOT EXISTS "bom_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"operation_no" varchar(50) NOT NULL,
	"operation_name" varchar(255) NOT NULL,
	"description" text,
	"workstation_id" uuid,
	"workstation_type" varchar(100),
	"time_in_mins" numeric(15,2) DEFAULT '0',
	"operating_cost" numeric(15,2) DEFAULT '0',
	"base_operating_cost" numeric(15,2) DEFAULT '0',
	"hour_rate" numeric(15,2) DEFAULT '0',
	"base_hour_rate" numeric(15,2) DEFAULT '0',
	"batch_size" integer DEFAULT 1,
	"fixed_time_in_mins" numeric(15,2) DEFAULT '0',
	"set_up_time" numeric(15,2) DEFAULT '0',
	"tear_down_time" numeric(15,2) DEFAULT '0',
	"sequence_id" integer DEFAULT 0,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOM scrap items table
CREATE TABLE IF NOT EXISTS "bom_scrap_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"stock_qty" numeric(15,6) DEFAULT '0',
	"rate" numeric(15,2) DEFAULT '0',
	"amount" numeric(15,2) DEFAULT '0',
	"base_rate" numeric(15,2) DEFAULT '0',
	"base_amount" numeric(15,2) DEFAULT '0',
	"stock_uom" varchar(50),
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOM alternative items table
CREATE TABLE IF NOT EXISTS "bom_alternative_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_item_id" uuid NOT NULL,
	"alternative_item_id" uuid NOT NULL,
	"alternative_item_code" varchar(100) NOT NULL,
	"alternative_item_name" varchar(255) NOT NULL,
	"conversion_factor" numeric(15,6) DEFAULT '1',
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create BOM update log table
CREATE TABLE IF NOT EXISTS "bom_update_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"update_type" varchar(50) NOT NULL,
	"change_description" text,
	"previous_data" jsonb,
	"new_data" jsonb,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
-- Add foreign key constraints
ALTER TABLE "workstations" ADD CONSTRAINT "workstations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workstations" ADD CONSTRAINT "workstations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "boms" ADD CONSTRAINT "boms_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "boms" ADD CONSTRAINT "boms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "boms" ADD CONSTRAINT "boms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_em_id_items_id_fk" FOREIGNY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "bom_operations" ADD CONSTRAINT "bom_operations_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bom_operations" ADD CONSTRAINT "bom_operations_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "bom_scrap_items" ADD CONSTRAINT "bom_scrap_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bom_scrap_items" ADD CONSTRAINT "bom_scrap_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "bom_alternative_items" ADD CONSTRAINT "bom_alternative_items_bom_item_id_bom_items_id_fk" FOREIGN KEY ("bom_item_id") REFERENCES "bom_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bom_alternative_items" ADD CONSTRAINT "bom_alternative_items_alternative_item_id_items_id_fk" FOREIGN KEY ("alternative_item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "bom_update_log" ADD CONSTRAINT "bom_update_log_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bom_update_log" ADD CONSTRAINT "bom_update_log_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_workstation_name" ON "workstations" ("workstation_name");
CREATE INDEX IF NOT EXISTS "idx_workstation_company_id" ON "workstations" ("company_id");
CREATE INDEX IF NOT EXISTS "idx_workstation_warehouse_id" ON "workstations" ("warehouse_id");

CREATE INDEX IF NOT EXISTS "idx_bom_no" ON "boms" ("bom_no");
CREATE INDEX IF NOT EXISTS "idx_bom_item_id" ON "boms" ("item_id");
CREATE INDEX IF NOT EXISTS "idx_bom_company_id" ON "boms" ("company_id");
CREATE INDEX IF NOT EXISTS "idx_bom_version" ON "boms" ("version");
CREATE INDEX IF NOT EXISTS "idx_bom_is_active" ON "boms" ("is_active");

CREATE INDEX IF NOT EXISTS "idx_bom_items_bom_id" ON "bom_items" ("bom_id");
CREATE INDEX IF NOT EXISTS "idx_bom_items_item_id" ON "bom_items" ("item_id");

CREATE INDEX IF NOT EXISTS "idx_bom_operations_bom_id" ON "bom_operations" ("bom_id");
CREATE INDEX IF NOT EXISTS "idx_bom_operations_operation_no" ON "bom_operations" ("operation_no");
CREATE INDEX IF NOT EXISTS "idx_bom_operations_sequence" ON "bom_operations" ("sequence_id");

CREATE INDEX IF NOT EXISTS "idx_bom_scrap_items_bom_id" ON "bom_scrap_items" ("bom_id");
CREATE INDEX IF NOT EXISTS "idx_bom_scrap_items_item_id" ON "bom_scrap_items" ("item_id");

CREATE INDEX IF NOT EXISTS "idx_bom_alt_items_bom_item_id" ON "bom_alternative_items" ("bom_item_id");
CREATE INDEX IF NOT EXISTS "idx_bom_alt_items_alt_item_id" ON "bom_alternative_items" ("alternative_item_id");

CREATE INDEX IF NOT EXISTS "idx_bom_update_log_bom_id" ON "bom_update_log" ("bom_id");
CREATE INDEX IF NOT EXISTS "idx_bom_update_log_update_type" ON "bom_update_log" ("update_type");
CREATE INDEX IF NOT EXISTS "idx_bom_update_log_created_at" ON "bom_update_log" ("created_at");

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "idx_bom_no_company_unique" ON "boms" ("bom_no", "company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_workstation_name_company_unique" ON "workstations" ("workstation_name", "company_id");

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workstations_updated_at BEFORE UPDATE ON workstations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boms_updated_at BEFORE UPDATE ON boms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_operations_updated_at BEFORE UPDATE ON bom_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_scrap_items_updated_at BEFORE UPDATE ON bom_scrap_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_alternative_items_updated_at BEFORE UPDATE ON bom_alternative_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
