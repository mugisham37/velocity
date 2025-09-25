-- Migration: 0005_inventory_management.sql
-- Description: Create comprehensive inventory management tables for item master management

-- Create item categories table for hierarchical organization
CREATE TABLE IF NOT EXISTS "item_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_code" varchar(50) NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"parent_category_id" uuid,
	"description" text,
	"is_group" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item attributes table for custom properties
CREATE TABLE IF NOT EXISTS "item_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attribute_name" varchar(100) NOT NULL,
	"attribute_type" varchar(50) NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"select_options" jsonb,
	"validation_rules" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item attribute values table
CREATE TABLE IF NOT EXISTS "item_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item variants table for matrix-based configuration
CREATE TABLE IF NOT EXISTS "item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_item_id" uuid NOT NULL,
	"variant_item_id" uuid NOT NULL,
	"variant_attributes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item cross references table for substitutes and alternatives
CREATE TABLE IF NOT EXISTS "item_cross_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"reference_item_id" uuid NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item documents table for images and files
CREATE TABLE IF NOT EXISTS "item_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"description" text,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create item lifecycle table for stage management
CREATE TABLE IF NOT EXISTS "item_lifecycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"stage" varchar(50) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"reason" text,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create item pricing tiers table for customer-specific and volume-based pricing
CREATE TABLE IF NOT EXISTS "item_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"price_list" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"customer_id" uuid,
	"min_qty" numeric(15,2) DEFAULT '0' NOT NULL,
	"max_qty" numeric(15,2),
	"rate" numeric(15,2) NOT NULL,
	"discount_percent" numeric(5,2) DEFAULT '0',
	"valid_from" timestamp NOT NULL,
	"valid_upto" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add new columns to existing items table
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "category_id" uuid;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "current_stage" varchar(50) DEFAULT 'Introduction';
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "discontinued_date" timestamp;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "replacement_item_id" uuid;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "sales_uom_conversion_factor" numeric(15,6) DEFAULT '1';
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "purchase_uom_conversion_factor" numeric(15,6) DEFAULT '1';
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "last_purchase_rate" numeric(15,2) DEFAULT '0';
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "inspection_required" boolean DEFAULT false NOT NULL;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "quality_inspection_template" varchar(100);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "max_order_qty" numeric(15,2);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "lead_time_days" integer DEFAULT 0;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "weight" numeric(15,3);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "weight_uom" varchar(20);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "length" numeric(15,3);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "width" numeric(15,3);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "height" numeric(15,3);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "dimension_uom" varchar(20);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "cogs_account" varchar(100);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "asset_account" varchar(100);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "manufacturer_part_no" varchar(100);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "hs_code" varchar(20);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "barcode" varchar(100);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "barcode_type" varchar(20);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "is_fixed_asset" boolean DEFAULT false NOT NULL;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "updated_by" uuid;

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_parent_category_id_item_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "item_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_attributes" ADD CONSTRAINT "item_attributes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_attribute_values" ADD CONSTRAINT "item_attribute_values_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_attribute_values" ADD CONSTRAINT "item_attribute_values_attribute_id_item_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "item_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_variants" ADD CONSTRAINT "item_variants_template_item_id_items_id_fk" FOREIGN KEY ("template_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_variants" ADD CONSTRAINT "item_variants_variant_item_id_items_id_fk" FOREIGN KEY ("variant_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_cross_references" ADD CONSTRAINT "item_cross_references_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_cross_references" ADD CONSTRAINT "item_cross_references_reference_item_id_items_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_lifecycle" ADD CONSTRAINT "item_lifecycle_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_lifecycle" ADD CONSTRAINT "item_lifecycle_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_pricing_tiers" ADD CONSTRAINT "item_pricing_tiers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "item_pricing_tiers" ADD CONSTRAINT "item_pricing_tiers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "item_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_replacement_item_id_items_id_fk" FOREIGN KEY ("replacement_item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "item_categories_code_idx" ON "item_categories" ("category_code");
CREATE INDEX IF NOT EXISTS "item_categories_company_idx" ON "item_categories" ("company_id");
CREATE INDEX IF NOT EXISTS "item_attributes_name_idx" ON "item_attributes" ("attribute_name");
CREATE INDEX IF NOT EXISTS "item_attributes_company_idx" ON "item_attributes" ("company_id");
CREATE INDEX IF NOT EXISTS "item_attribute_values_item_idx" ON "item_attribute_values" ("item_id");
CREATE INDEX IF NOT EXISTS "item_attribute_values_attribute_idx" ON "item_attribute_values" ("attribute_id");
CREATE INDEX IF NOT EXISTS "item_variants_template_idx" ON "item_variants" ("template_item_id");
CREATE INDEX IF NOT EXISTS "item_variants_variant_idx" ON "item_variants" ("variant_item_id");
CREATE INDEX IF NOT EXISTS "item_cross_references_item_idx" ON "item_cross_references" ("item_id");
CREATE INDEX IF NOT EXISTS "item_cross_references_reference_idx" ON "item_cross_references" ("reference_item_id");
CREATE INDEX IF NOT EXISTS "item_cross_references_type_idx" ON "item_cross_references" ("reference_type");
CREATE INDEX IF NOT EXISTS "item_documents_item_idx" ON "item_documents" ("item_id");
CREATE INDEX IF NOT EXISTS "item_documents_type_idx" ON "item_documents" ("document_type");
CREATE INDEX IF NOT EXISTS "item_documents_primary_idx" ON "item_documents" ("item_id","is_primary");
CREATE INDEX IF NOT EXISTS "item_lifecycle_item_idx" ON "item_lifecycle" ("item_id");
CREATE INDEX IF NOT EXISTS "item_lifecycle_stage_idx" ON "item_lifecycle" ("stage");
CREATE INDEX IF NOT EXISTS "item_lifecycle_date_idx" ON "item_lifecycle" ("effective_date");
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_item_idx" ON "item_pricing_tiers" ("item_id");
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_price_list_idx" ON "item_pricing_tiers" ("price_list");
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_customer_idx" ON "item_pricing_tiers" ("customer_id");
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_validity_idx" ON "item_pricing_tiers" ("valid_from","valid_upto");
CREATE INDEX IF NOT EXISTS "items_category_idx" ON "items" ("category_id");
CREATE INDEX IF NOT EXISTS "items_type_idx" ON "items" ("item_type");
CREATE INDEX IF NOT EXISTS "items_stage_idx" ON "items" ("current_stage");
CREATE INDEX IF NOT EXISTS "items_barcode_idx" ON "items" ("barcode");
CREATE INDEX IF NOT EXISTS "items_brand_idx" ON "items" ("brand");
CREATE INDEX IF NOT EXISTS "items_manufacturer_idx" ON "items" ("manufacturer");
CREATE INDEX IF NOT EXISTS "items_company_idx" ON "items" ("company_id");

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "item_attribute_unique" ON "item_attribute_values" ("item_id","attribute_id");
CREATE UNIQUE INDEX IF NOT EXISTS "items_code_company_unique" ON "items" ("item_code","company_id");

-- Add comments for documentation
COMMENT ON TABLE "item_categories" IS 'Hierarchical item categories for organizing items';
COMMENT ON TABLE "item_attributes" IS 'Custom attributes that can be assigned to items';
COMMENT ON TABLE "item_attribute_values" IS 'Values of custom attributes for specific items';
COMMENT ON TABLE "item_variants" IS 'Matrix-based item variants configuration';
COMMENT ON TABLE "item_cross_references" IS 'Cross-references between items (substitutes, alternatives, etc.)';
COMMENT ON TABLE "item_documents" IS 'Documents and images associated with items';
COMMENT ON TABLE "item_lifecycle" IS 'Item lifecycle stage tracking';
COMMENT ON TABLE "item_pricing_tiers" IS 'Customer-specific and volume-based pricing tiers';

COMMENT ON COLUMN "item_attributes"."attribute_type" IS 'Type of attribute: Text, Number, Date, Boolean, Select';
COMMENT ON COLUMN "item_cross_references"."reference_type" IS 'Type of reference: Substitute, Alternative, Accessory, Related';
COMMENT ON COLUMN "item_documents"."document_type" IS 'Type of document: Image, PDF, Video, Manual, Certificate';
COMMENT ON COLUMN "item_lifecycle"."stage" IS 'Lifecycle stage: Introduction, Growth, Maturity, Decline, Discontinuation';
COMMENT ON COLUMN "items"."current_stage" IS 'Current lifecycle stage of the item';
COMMENT ON COLUMN "items"."barcode_type" IS 'Type of barcode: EAN, UPC, Code128, Code39, QR';
