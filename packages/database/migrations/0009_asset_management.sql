-- Asset Management Module Migration
-- This migration creates all tables for the Asset Management module including:
-- - Asset Registration & Tracking
-- - Depreciation Management
-- - Maintenance Management

-- Asset Categories
CREATE TABLE IF NOT EXISTS "asset_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_code" varchT NULL,
  "category_name" varchar(255) NOT NULL,
  "parent_category_id" uuid,
  "description" text,
  "default_depreciation_method" varchar(50),
  "default_useful_life" integer,
  "default_salvage_value_percent" decimal(5,2),
  "asset_account_id" uuid,
  "depreciation_account_id" uuid,
  "accumulated_depreciation_account_id" uuid,
  "custom_attributes" jsonb,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "asset_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_parent_category_id_asset_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "asset_categories"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("depreciation_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_accumulated_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_categories_category_code_company_id_unique" ON "asset_categories" ("category_code", "company_id");
CREATE INDEX IF NOT EXISTS "asset_categories_parent_category_id_idx" ON "asset_categories" ("parent_category_id");

-- Asset Locations
CREATE TABLE IF NOT EXISTS "asset_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "location_code" varchar(50) NOT NULL,
  "location_name" varchar(255) NOT NULL,
  "parent_location_id" uuid,
  "address" text,
  "city" varchar(100),
  "state" varchar(100),
  "country" varchar(100),
  "postal_code" varchar(20),
  "latitude" decimal(10,8),
  "longitude" decimal(11,8),
  "description" text,
  "location_manager_id" uuid,
  "capacity" integer,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "asset_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_locations_parent_location_id_asset_locations_id_fk" FOREIGN KEY ("parent_location_id") REFERENCES "asset_locations"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_locations_location_manager_id_users_id_fk" FOREIGN KEY ("location_manager_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_locations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_locations_location_code_company_id_unique" ON "asset_locations" ("location_code", "company_id");
CREATE INDEX IF NOT EXISTS "asset_locations_parent_location_id_idx" ON "asset_locations" ("parent_location_id");
CREATE INDEX IF NOT EXISTS "asset_locations_location_manager_id_idx" ON "asset_locations" ("location_manager_id");

-- Assets
CREATE TABLE IF NOT EXISTS "assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_code" varchar(50) NOT NULL,
  "asset_name" varchar(255) NOT NULL,
  "asset_category_id" uuid,
  "description" text,
  "specifications" jsonb,
  "serial_number" varchar(100),
  "model_number" varchar(100),
  "manufacturer" varchar(255),
  "supplier" varchar(255),
  "purchase_date" timestamp,
  "purchase_amount" decimal(15,2),
  "current_value" decimal(15,2),
  "salvage_value" decimal(15,2) DEFAULT '0',
  "depreciation_method" varchar(50) DEFAULT 'Straight Line',
  "useful_life" integer,
  "depreciation_start_date" timestamp,
  "current_location_id" uuid,
  "custodian_id" uuid,
  "department_id" uuid,
  "status" varchar(50) DEFAULT 'Active',
  "condition" varchar(50) DEFAULT 'Good',
  "barcode" varchar(100),
  "rfid_tag" varchar(100),
  "qr_code" varchar(255),
  "warranty_expiry_date" timestamp,
  "insurance_policy_number" varchar(100),
  "insurance_expiry_date" timestamp,
  "compliance_certifications" jsonb,
  "documents" jsonb,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "assets_asset_category_id_asset_categories_id_fk" FOREIGN KEY ("asset_category_id") REFERENCES "asset_categories"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "assets_current_location_id_asset_locations_id_fk" FOREIGN KEY ("current_location_id") REFERENCES "asset_locations"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "assets_custodian_id_users_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "assets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "assets_asset_code_company_id_unique" ON "assets" ("asset_code", "company_id");
CREATE INDEX IF NOT EXISTS "assets_serial_number_idx" ON "assets" ("serial_number");
CREATE INDEX IF NOT EXISTS "assets_barcode_idx" ON "assets" ("barcode");
CREATE INDEX IF NOT EXISTS "assets_rfid_tag_idx" ON "assets" ("rfid_tag");
CREATE INDEX IF NOT EXISTS "assets_status_idx" ON "assets" ("status");
CREATE INDEX IF NOT EXISTS "assets_asset_category_id_idx" ON "assets" ("asset_category_id");
CREATE INDEX IF NOT EXISTS "assets_current_location_id_idx" ON "assets" ("current_location_id");
CREATE INDEX IF NOT EXISTS "assets_custodian_id_idx" ON "assets" ("custodian_id");

-- Asset Transfers
CREATE TABLE IF NOT EXISTS "asset_transfers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "transfer_number" varchar(50) NOT NULL,
  "asset_id" uuid NOT NULL,
  "from_location_id" uuid,
  "to_location_id" uuid NOT NULL,
  "from_custodian_id" uuid,
  "to_custodian_id" uuid,
  "transfer_date" timestamp NOT NULL,
  "transfer_reason" varchar(255),
  "notes" text,
  "status" varchar(50) DEFAULT 'Pending',
  "approved_by" uuid,
  "approved_at" timestamp,
  "completed_at" timestamp,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "asset_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_from_location_id_asset_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "asset_locations"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_to_location_id_asset_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "asset_locations"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_from_custodian_id_users_id_fk" FOREIGN KEY ("from_custodian_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_to_custodian_id_users_id_fk" FOREIGN KEY ("to_custodian_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_transfers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_transfers_transfer_number_company_id_unique" ON "asset_transfers" ("transfer_number", "company_id");
CREATE INDEX IF NOT EXISTS "asset_transfers_asset_id_idx" ON "asset_transfers" ("asset_id");
CREATE INDEX IF NOT EXISTS "asset_transfers_status_idx" ON "asset_transfers" ("status");
CREATE INDEX IF NOT EXISTS "asset_transfers_transfer_date_idx" ON "asset_transfers" ("transfer_date");

-- Asset Disposals
CREATE TABLE IF NOT EXISTS "asset_disposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disposal_number" varchar(50) NOT NULL,
  "asset_id" uuid NOT NULL,
  "disposal_date" timestamp NOT NULL,
  "disposal_method" varchar(50) NOT NULL,
  "disposal_reason" varchar(255),
  "book_value" decimal(15,2) NOT NULL,
  "disposal_amount" decimal(15,2) DEFAULT '0',
  "gain_loss" decimal(15,2),
  "buyer_name" varchar(255),
  "buyer_contact" varchar(255),
  "documents" jsonb,
  "notes" text,
  "status" varchar(50) DEFAULT 'Pending',
  "approved_by" uuid,
  "approved_at" timestamp,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "asset_disposals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_disposals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_disposals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_disposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_disposals_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_disposals_disposal_number_company_id_unique" ON "asset_disposals" ("disposal_number", "company_id");
CREATE INDEX IF NOT EXISTS "asset_disposals_asset_id_idx" ON "asset_disposals" ("asset_id");
CREATE INDEX IF NOT EXISTS "asset_disposals_status_idx" ON "asset_disposals" ("status");
CREATE INDEX IF NOT EXISTS "asset_disposals_disposal_date_idx" ON "asset_disposals" ("disposal_date");

-- Depreciation Methods
CREATE TABLE IF NOT EXISTS "depreciation_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "method_code" varchar(50) NOT NULL,
  "method_name" varchar(255) NOT NULL,
  "description" text,
  "formula" text,
  "parameters" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "applicable_asset_types" jsonb,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "depreciation_methods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_methods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_methods_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_methods_method_code_company_id_unique" ON "depreciation_methods" ("method_code", "company_id");
CREATE INDEX IF NOT EXISTS "depreciation_methods_is_active_idx" ON "depreciation_methods" ("is_active");

-- Depreciation Schedules
CREATE TABLE IF NOT EXISTS "depreciation_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_id" uuid NOT NULL,
  "schedule_number" varchar(50) NOT NULL,
  "depreciation_method" varchar(50) NOT NULL,
  "useful_life" integer NOT NULL,
  "salvage_value" decimal(15,2) DEFAULT '0',
  "asset_cost" decimal(15,2) NOT NULL,
  "depreciable_amount" decimal(15,2) NOT NULL,
  "depreciation_rate" decimal(5,2),
  "units_of_production" integer,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "tax_depreciation_method" varchar(50),
  "tax_useful_life" integer,
  "tax_salvage_value" decimal(15,2),
  "status" varchar(50) DEFAULT 'Active',
  "is_active" boolean DEFAULT true NOT NULL,
  "asset_account_id" uuid,
  "depreciation_expense_account_id" uuid,
  "accumulated_depreciation_account_id" uuid,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "depreciation_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_depreciation_expense_account_id_accounts_id_fk" FOREIGN KEY ("depreciation_expense_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_accumulated_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_schedules_schedule_number_company_id_unique" ON "depreciation_schedules" ("schedule_number", "company_id");
CREATE INDEX IF NOT EXISTS "depreciation_schedules_asset_id_idx" ON "depreciation_schedules" ("asset_id");
CREATE INDEX IF NOT EXISTS "depreciation_schedules_status_idx" ON "depreciation_schedules" ("status");
CREATE INDEX IF NOT EXISTS "depreciation_schedules_start_date_idx" ON "depreciation_schedules" ("start_date");

-- Depreciation Entries
CREATE TABLE IF NOT EXISTS "depreciation_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_id" uuid NOT NULL,
  "entry_number" varchar(50) NOT NULL,
  "depreciation_date" timestamp NOT NULL,
  "period_start_date" timestamp NOT NULL,
  "period_end_date" timestamp NOT NULL,
  "depreciation_amount" decimal(15,2) NOT NULL,
  "accumulated_depreciation" decimal(15,2) NOT NULL,
  "book_value" decimal(15,2) NOT NULL,
  "tax_depreciation_amount" decimal(15,2),
  "tax_accumulated_depreciation" decimal(15,2),
  "tax_book_value" decimal(15,2),
  "actual_units_produced" integer,
  "gl_entry_id" uuid,
  "is_posted" boolean DEFAULT false NOT NULL,
  "posted_at" timestamp,
  "posted_by" uuid,
  "is_reversed" boolean DEFAULT false NOT NULL,
  "reversed_at" timestamp,
  "reversed_by" uuid,
  "reversal_reason" text,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "depreciation_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_entries_schedule_id_depreciation_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "depreciation_schedules"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_entries_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_entries_reversed_by_users_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "depreciation_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_entries_entry_number_company_id_unique" ON "depreciation_entries" ("entry_number", "company_id");
CREATE INDEX IF NOT EXISTS "depreciation_entries_schedule_id_idx" ON "depreciation_entries" ("schedule_id");
CREATE INDEX IF NOT EXISTS "depreciation_entries_depreciation_date_idx" ON "depreciation_entries" ("depreciation_date");
CREATE INDEX IF NOT EXISTS "depreciation_entries_is_posted_idx" ON "depreciation_entries" ("is_posted");
CREATE INDEX IF NOT EXISTS "depreciation_entries_gl_entry_id_idx" ON "depreciation_entries" ("gl_entry_id");

-- Asset Revaluations
CREATE TABLE IF NOT EXISTS "asset_revaluations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_id" uuid NOT NULL,
  "revaluation_number" varchar(50) NOT NULL,
  "revaluation_date" timestamp NOT NULL,
  "revaluation_method" varchar(50) NOT NULL,
  "previous_book_value" decimal(15,2) NOT NULL,
  "new_fair_value" decimal(15,2) NOT NULL,
  "revaluation_surplus" decimal(15,2) NOT NULL,
  "valuation_basis" text,
  "valued_by" varchar(255),
  "valuation_report" jsonb,
  "asset_account_id" uuid,
  "revaluation_surplus_account_id" uuid,
  "gl_entry_id" uuid,
  "is_posted" boolean DEFAULT false NOT NULL,
  "posted_at" timestamp,
  "posted_by" uuid,
  "status" varchar(50) DEFAULT 'Draft',
  "approved_by" uuid,
  "approved_at" timestamp,
  "documents" jsonb,
  "notes" text,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "asset_revaluations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_revaluation_surplus_account_id_accounts_id_fk" FOREIGN KEY ("revaluation_surplus_account_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "asset_revaluations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "asset_revaluations_revaluation_number_company_id_unique" ON "asset_revaluations" ("revaluation_number", "company_id");
CREATE INDEX IF NOT EXISTS "asset_revaluations_asset_id_idx" ON "asset_revaluations" ("asset_id");
CREATE INDEX IF NOT EXISTS "asset_revaluations_revaluation_date_idx" ON "asset_revaluations" ("revaluation_date");
CREATE INDEX IF NOT EXISTS "asset_revaluations_status_idx" ON "asset_revaluations" ("status");
CREATE INDEX IF NOT EXISTS "asset_revaluations_is_posted_idx" ON "asset_revaluations" ("is_posted");

-- Maintenance Schedules
CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_code" varchar(50) NOT NULL,
  "schedule_name" varchar(255) NOT NULL,
  "asset_id" uuid NOT NULL,
  "maintenance_type" varchar(50) NOT NULL,
  "schedule_type" varchar(50) NOT NULL,
  "frequency" integer,
  "frequency_unit" varchar(20),
  "usage_threshold" integer,
  "usage_unit" varchar(50),
  "start_date" timestamp NOT NULL,
  "end_date" timestamp,
  "next_due_date" timestamp,
  "last_maintenance_date" timestamp,
  "description" text,
  "instructions" text,
  "estimated_duration" integer,
  "priority" varchar(20) DEFAULT 'Medium',
  "required_skills" jsonb,
  "estimated_cost" decimal(15,2),
  "status" varchar(50) DEFAULT 'Active',
  "is_active" boolean DEFAULT true NOT NULL,
  "notification_lead_time" integer,
  "notify_users" jsonb,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "maintenance_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "maintenance_schedules_schedule_code_company_id_unique" ON "maintenance_schedules" ("schedule_code", "company_id");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_asset_id_idx" ON "maintenance_schedules" ("asset_id");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_status_idx" ON "maintenance_schedules" ("status");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_next_due_date_idx" ON "maintenance_schedules" ("next_due_date");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_priority_idx" ON "maintenance_schedules" ("priority");

-- Spare Parts
CREATE TABLE IF NOT EXISTS "spare_parts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "part_code" varchar(50) NOT NULL,
  "part_name" varchar(255) NOT NULL,
  "item_id" uuid,
  "description" text,
  "manufacturer" varchar(255),
  "manufacturer_part_number" varchar(100),
  "supplier_part_number" varchar(100),
  "current_stock" integer DEFAULT 0,
  "minimum_stock" integer DEFAULT 0,
  "maximum_stock" integer,
  "reorder_point" integer,
  "unit_cost" decimal(15,2),
  "last_purchase_price" decimal(15,2),
  "average_cost" decimal(15,2),
  "specifications" jsonb,
  "compatible_assets" jsonb,
  "storage_location" varchar(255),
  "shelf_life" integer,
  "status" varchar(50) DEFAULT 'Active',
  "is_active" boolean DEFAULT true NOT NULL,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "spare_parts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "spare_parts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "spare_parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "spare_parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "spare_parts_part_code_company_id_unique" ON "spare_parts" ("part_code", "company_id");
CREATE INDEX IF NOT EXISTS "spare_parts_item_id_idx" ON "spare_parts" ("item_id");
CREATE INDEX IF NOT EXISTS "spare_parts_status_idx" ON "spare_parts" ("status");
CREATE INDEX IF NOT EXISTS "spare_parts_manufacturer_part_number_idx" ON "spare_parts" ("manufacturer_part_number");

-- Maintenance Work Orders
CREATE TABLE IF NOT EXISTS "maintenance_work_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "work_order_number" varchar(50) NOT NULL,
  "asset_id" uuid NOT NULL,
  "schedule_id" uuid,
  "title" varchar(255) NOT NULL,
  "description" text,
  "work_order_type" varchar(50) NOT NULL,
  "priority" varchar(20) DEFAULT 'Medium',
  "scheduled_start_date" timestamp,
  "scheduled_end_date" timestamp,
  "actual_start_date" timestamp,
  "actual_end_date" timestamp,
  "estimated_duration" integer,
  "actual_duration" integer,
  "assigned_to_id" uuid,
  "assigned_team" jsonb,
  "status" varchar(50) DEFAULT 'Open',
  "completion_percentage" integer DEFAULT 0,
  "estimated_cost" decimal(15,2),
  "actual_cost" decimal(15,2),
  "labor_cost" decimal(15,2),
  "material_cost" decimal(15,2),
  "external_service_cost" decimal(15,2),
  "failure_description" text,
  "failure_cause" text,
  "failure_type" varchar(100),
  "work_performed" text,
  "parts_used" jsonb,
  "completion_notes" text,
  "completed_by" uuid,
  "completed_at" timestamp,
  "safety_precautions" text,
  "quality_checks" jsonb,
  "attachments" jsonb,
  "approved_by" uuid,
  "approved_at" timestamp,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "maintenance_work_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_work_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "maintenance_work_orders_work_order_number_company_id_unique" ON "maintenance_work_orders" ("work_order_number", "company_id");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_asset_id_idx" ON "maintenance_work_orders" ("asset_id");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_schedule_id_idx" ON "maintenance_work_orders" ("schedule_id");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_status_idx" ON "maintenance_work_orders" ("status");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_priority_idx" ON "maintenance_work_orders" ("priority");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_assigned_to_id_idx" ON "maintenance_work_orders" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_scheduled_start_date_idx" ON "maintenance_work_orders" ("scheduled_start_date");

-- Maintenance History
CREATE TABLE IF NOT EXISTS "maintenance_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_id" uuid NOT NULL,
  "work_order_id" uuid,
  "maintenance_date" timestamp NOT NULL,
  "maintenance_type" varchar(50) NOT NULL,
  "description" text NOT NULL,
  "downtime" integer,
  "mtbf" integer,
  "mttr" integer,
  "total_cost" decimal(15,2),
  "labor_hours" decimal(8,2),
  "labor_cost" decimal(15,2),
  "material_cost" decimal(15,2),
  "performed_by" uuid,
  "technician_notes" text,
  "parts_used" jsonb,
  "effectiveness_rating" integer,
  "customer_satisfaction" integer,
  "follow_up_required" boolean DEFAULT false,
  "follow_up_date" timestamp,
  "follow_up_notes" text,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "maintenance_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_history_work_order_id_maintenance_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "maintenance_work_orders"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE INDEX IF NOT EXISTS "maintenance_history_asset_id_idx" ON "maintenance_history" ("asset_id");
CREATE INDEX IF NOT EXISTS "maintenance_history_work_order_id_idx" ON "maintenance_history" ("work_order_id");
CREATE INDEX IF NOT EXISTS "maintenance_history_maintenance_date_idx" ON "maintenance_history" ("maintenance_date");
CREATE INDEX IF NOT EXISTS "maintenance_history_performed_by_idx" ON "maintenance_history" ("performed_by");

-- Maintenance Costs
CREATE TABLE IF NOT EXISTS "maintenance_costs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "work_order_id" uuid NOT NULL,
  "cost_type" varchar(50) NOT NULL,
  "description" text,
  "quantity" decimal(15,6),
  "unit_cost" decimal(15,2),
  "total_cost" decimal(15,2) NOT NULL,
  "labor_hours" decimal(8,2),
  "hourly_rate" decimal(15,2),
  "technician_id" uuid,
  "spare_part_id" uuid,
  "quantity_used" integer,
  "vendor_name" varchar(255),
  "service_description" text,
  "cost_date" timestamp NOT NULL,
  "status" varchar(50) DEFAULT 'Pending',
  "approved_by" uuid,
  "approved_at" timestamp,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  CONSTRAINT "maintenance_costs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_work_order_id_maintenance_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "maintenance_work_orders"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade,
  CONSTRAINT "maintenance_costs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade
);

CREATE INDEX IF NOT EXISTS "maintenance_costs_work_order_id_idx" ON "maintenance_costs" ("work_order_id");
CREATE INDEX IF NOT EXISTS "maintenance_costs_cost_type_idx" ON "maintenance_costs" ("cost_type");
CREATE INDEX IF NOT EXISTS "maintenance_costs_cost_date_idx" ON "maintenance_costs" ("cost_date");
CREATE INDEX IF NOT EXISTS "maintenance_costs_status_idx" ON "maintenance_costs" ("status");
CREATE INDEX IF NOT EXISTS "maintenance_costs_technician_id_idx" ON "maintenance_costs" ("technician_id");
CREATE INDEX IF NOT EXISTS "maintenance_costs_spare_part_id_idx" ON "maintenance_costs" ("spare_part_id");

-- Insert default depreciation methods
INSERT INTO "depreciation_methods" ("method_code", "method_name", "description", "formula", "parameters", "company_id", "created_at", "updated_at")
SELECT
  'SL',
  'Straight Line',
  'Depreciation is calculated evenly over the useful life of the asset',
  '(Asset Cost - Salvage Value) / Useful Life',
  '{"type": "time_based", "calculation": "linear"}',
  c.id,
  now(),
  now()
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM depreciation_methods dm
  WHERE dm.method_code = 'SL' AND dm.company_id = c.id
);

INSERT INTO "depreciation_methods" ("method_code", "method_name", "description", "formula", "parameters", "company_id", "created_at", "updated_at")
SELECT
  'DB',
  'Declining Balance',
  'Depreciation is calculated as a percentage of the remaining book value',
  'Book Value * Depreciation Rate',
  '{"type": "accelerated", "calculation": "declining_balance"}',
  c.id,
  now(),
  now()
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM depreciation_methods dm
  WHERE dm.method_code = 'DB' AND dm.company_id = c.id
);

INSERT INTO "depreciation_methods" ("method_code", "method_name", "description", "formula", "parameters", "company_id", "created_at", "updated_at")
SELECT
  'UOP',
  'Units of Production',
  'Depreciation is calculated based on actual usage or production',
  '(Asset Cost - Salvage Value) * (Actual Units / Total Expected Units)',
  '{"type": "usage_based", "calculation": "units_of_production"}',
  c.id,
  now(),
  now()
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM depreciation_methods dm
  WHERE dm.method_code = 'UOP' AND dm.company_id = c.id
);

INSERT INTO "depreciation_methods" ("method_code", "method_name", "description", "formula", "parameters", "company_id", "created_at", "updated_at")
SELECT
  'SYD',
  'Sum of Years Digits',
  'Accelerated depreciation method using sum of years digits',
  '(Asset Cost - Salvage Value) * (Remaining Life / Sum of Years)',
  '{"type": "accelerated", "calculation": "sum_of_years_digits"}',
  c.id,
  now(),
  now()
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM depreciation_methods dm
  WHERE dm.method_code = 'SYD' AND dm.company_id = c.id
);
