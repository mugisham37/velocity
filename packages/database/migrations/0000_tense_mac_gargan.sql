DO $$ BEGIN
 CREATE TYPE "approval_status" AS ENUM('pending', 'approved', 'rejected', 'escalated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "bill_status" AS ENUM('draft', 'submitted', 'approved', 'paid', 'partially_paid', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "matching_status" AS ENUM('unmatched', 'partially_matched', 'fully_matched', 'exception');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "vendor_payment_status" AS ENUM('pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "dunning_level" AS ENUM('first_reminder', 'second_reminder', 'final_notice', 'legal_action');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "invoice_status" AS ENUM('draft', 'submitted', 'paid', 'partially_paid', 'overdue', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "bank_account_type" AS ENUM('checking', 'savings', 'credit_card', 'loan', 'investment', 'petty_cash');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "payment_gateway" AS ENUM('stripe', 'paypal', 'square', 'authorize_net', 'braintree', 'adyen');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "reconciliation_status" AS ENUM('unreconciled', 'matched', 'cleared', 'disputed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_type" AS ENUM('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'dividend', 'check', 'ach', 'wire', 'card_payment', 'online_payment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "alert_severity" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "alert_status" AS ENUM('open', 'acknowledged', 'resolved', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "device_status" AS ENUM('active', 'inactive', 'maintenance', 'error', 'offline');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "sensor_type" AS ENUM('temperature', 'humidity', 'pressure', 'vibration', 'current', 'voltage', 'power', 'flow', 'level', 'ph', 'conductivity', 'turbidity', 'gps', 'rfid', 'proximity', 'motion', 'light', 'sound', 'gas', 'smoke', 'air_quality', 'energy', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "lead_source" AS ENUM('Website', 'Email Campaign', 'Social Media', 'Referral', 'Cold Call', 'Trade Show', 'Advertisement', 'Partner', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "lead_status" AS ENUM('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost', 'Unqualified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "opportunity_stage" AS ENUM('Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "quotation_status" AS ENUM('Draft', 'Sent', 'Expired', 'Accepted', 'Rejected', 'Cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "sales_order_status" AS ENUM('Draft', 'Pending Approval', 'Approved', 'Confirmed', 'Partially Delivered', 'Delivered', 'Partially Invoiced', 'Invoiced', 'Cancelled', 'On Hold');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_code" varchar(50) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"parent_account_id" uuid,
	"company_id" uuid NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"is_group" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fiscal_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"fiscal_year_id" uuid NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fiscal_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gl_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"reference" varchar(255),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"posting_date" timestamp NOT NULL,
	"reference" varchar(255),
	"description" text,
	"total_debit" numeric(15, 2) NOT NULL,
	"total_credit" numeric(15, 2) NOT NULL,
	"is_posted" boolean DEFAULT false NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry_template_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit_formula" text,
	"credit_formula" text,
	"description" text,
	"sequence" varchar(10) DEFAULT '10' NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recurring_journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"template_id" uuid NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"next_run_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"comments" text,
	"delegated_to" uuid,
	"action_date" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" uuid NOT NULL,
	"current_step_id" uuid,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" varchar(255) NOT NULL,
	"approver_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"can_delegate" boolean DEFAULT false NOT NULL,
	"timeout_hours" integer DEFAULT 24 NOT NULL,
	"escalation_user_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"document_type" varchar(50) NOT NULL,
	"min_amount" numeric(15, 2),
	"max_amount" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"item_code" varchar(100),
	"description" text NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"account_id" uuid,
	"purchase_order_line_id" uuid,
	"receipt_line_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill_numbering_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_name" varchar(100) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"current_number" integer DEFAULT 1 NOT NULL,
	"pad_length" integer DEFAULT 6 NOT NULL,
	"suffix" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"account_id" uuid,
	"parent_category_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_receipt" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"max_amount" numeric(15, 2),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"expense_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"merchant_name" varchar(255),
	"receipt_number" varchar(100),
	"receipt_url" varchar(500),
	"is_reimbursable" boolean DEFAULT true NOT NULL,
	"is_billable" boolean DEFAULT false NOT NULL,
	"customer_id" uuid,
	"project_id" uuid,
	"mileage" numeric(10, 2),
	"mileage_rate" numeric(10, 4),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_number" varchar(100) NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" timestamp NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"reimbursable_amount" numeric(15, 2) NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"purpose" text,
	"notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"paid_by" uuid,
	"paid_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"frequency" varchar(20) NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"cutoff_days" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"payment_date" timestamp NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"bill_count" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"processed_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "three_way_matching" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"receipt_id" uuid NOT NULL,
	"status" "matching_status" DEFAULT 'unmatched' NOT NULL,
	"quantity_variance" numeric(15, 4) DEFAULT '0' NOT NULL,
	"price_variance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_variance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tolerance_exceeded" boolean DEFAULT false NOT NULL,
	"matched_by" uuid,
	"matched_at" timestamp,
	"exception_reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_number" varchar(100) NOT NULL,
	"vendor_bill_number" varchar(100),
	"vendor_id" uuid NOT NULL,
	"bill_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(15, 2) NOT NULL,
	"status" "bill_status" DEFAULT 'draft' NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"terms" text,
	"notes" text,
	"template_id" uuid,
	"purchase_order_id" uuid,
	"receipt_id" uuid,
	"matching_status" "matching_status" DEFAULT 'unmatched' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" varchar(20),
	"next_bill_date" timestamp,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"allocated_amount" numeric(15, 2) NOT NULL,
	"allocation_date" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_number" varchar(100) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"payment_date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference" varchar(255),
	"bank_account_id" uuid,
	"check_number" varchar(50),
	"status" "vendor_payment_status" DEFAULT 'pending' NOT NULL,
	"scheduled_date" timestamp,
	"processed_date" timestamp,
	"notes" text,
	"allocated_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"unallocated_amount" numeric(15, 2) NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_limit_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_id" uuid,
	"check_date" timestamp DEFAULT now() NOT NULL,
	"current_outstanding" numeric(15, 2) NOT NULL,
	"credit_limit" numeric(15, 2) NOT NULL,
	"proposed_amount" numeric(15, 2) NOT NULL,
	"total_exposure" numeric(15, 2) NOT NULL,
	"is_approved" boolean NOT NULL,
	"approved_by" uuid,
	"approval_notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_credit_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"credit_limit" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"approved_by" uuid NOT NULL,
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_number" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"payment_date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference" varchar(255),
	"bank_account_id" uuid,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"allocated_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"unallocated_amount" numeric(15, 2) NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"statement_number" varchar(100) NOT NULL,
	"statement_date" timestamp NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"opening_balance" numeric(15, 2) NOT NULL,
	"closing_balance" numeric(15, 2) NOT NULL,
	"total_invoices" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_payments" numeric(15, 2) DEFAULT '0' NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dunning_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dunning_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"configuration_id" uuid NOT NULL,
	"level" "dunning_level" NOT NULL,
	"days_after_due" integer NOT NULL,
	"email_template" text,
	"sms_template" text,
	"letter_template" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dunning_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"level" "dunning_level" NOT NULL,
	"due_date" timestamp NOT NULL,
	"dunning_date" timestamp NOT NULL,
	"outstanding_amount" numeric(15, 2) NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"sms_sent" boolean DEFAULT false NOT NULL,
	"letter_sent" boolean DEFAULT false NOT NULL,
	"response" text,
	"next_dunning_date" timestamp,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"item_code" varchar(100),
	"description" text NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"account_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_numbering_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_name" varchar(100) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"current_number" integer DEFAULT 1 NOT NULL,
	"pad_length" integer DEFAULT 6 NOT NULL,
	"suffix" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(15, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"terms" text,
	"notes" text,
	"template_id" uuid,
	"sales_order_id" uuid,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" varchar(20),
	"next_invoice_date" timestamp,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"allocated_amount" numeric(15, 2) NOT NULL,
	"allocation_date" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_code" varchar(50) NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"parent_category_id" uuid,
	"description" text,
	"default_depreciation_method" varchar(50),
	"default_useful_life" integer,
	"default_salvage_value_percent" numeric(5, 2),
	"asset_account_id" uuid,
	"depreciation_account_id" uuid,
	"accumulated_depreciation_account_id" uuid,
	"custom_attributes" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "asset_categories_category_code_company_id_unique" UNIQUE("category_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_disposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disposal_number" varchar(50) NOT NULL,
	"asset_id" uuid NOT NULL,
	"disposal_date" timestamp NOT NULL,
	"disposal_method" varchar(50) NOT NULL,
	"disposal_reason" varchar(255),
	"book_value" numeric(15, 2) NOT NULL,
	"disposal_amount" numeric(15, 2) DEFAULT '0',
	"gain_loss" numeric(15, 2),
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
	CONSTRAINT "asset_disposals_disposal_number_company_id_unique" UNIQUE("disposal_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_code" varchar(50) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"parent_location_id" uuid,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"description" text,
	"location_manager_id" uuid,
	"capacity" integer,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "asset_locations_location_code_company_id_unique" UNIQUE("location_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	CONSTRAINT "asset_transfers_transfer_number_company_id_unique" UNIQUE("transfer_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"purchase_amount" numeric(15, 2),
	"current_value" numeric(15, 2),
	"salvage_value" numeric(15, 2) DEFAULT '0',
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
	CONSTRAINT "assets_asset_code_company_id_unique" UNIQUE("asset_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changes" jsonb,
	"user_id" uuid,
	"company_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"retention_period_days" varchar(10) NOT NULL,
	"company_id" uuid NOT NULL,
	"is_active" varchar(5) DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_number" varchar(100) NOT NULL,
	"routing_number" varchar(50),
	"bank_name" varchar(255) NOT NULL,
	"bank_address" text,
	"account_type" "bank_account_type" NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"current_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"available_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"last_reconciled" timestamp,
	"reconciled_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"gl_account_id" uuid,
	"overdraft_limit" numeric(15, 2),
	"interest_rate" numeric(5, 4),
	"minimum_balance" numeric(15, 2),
	"monthly_fee" numeric(10, 2),
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"reconciliation_date" timestamp NOT NULL,
	"statement_date" timestamp NOT NULL,
	"statement_balance" numeric(15, 2) NOT NULL,
	"book_balance" numeric(15, 2) NOT NULL,
	"adjusted_book_balance" numeric(15, 2) NOT NULL,
	"total_deposits_in_transit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_outstanding_checks" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_bank_adjustments" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_book_adjustments" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_balanced" boolean DEFAULT false NOT NULL,
	"variance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"reconciled_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_statement_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_format" varchar(20) NOT NULL,
	"import_date" timestamp DEFAULT now() NOT NULL,
	"statement_start_date" timestamp NOT NULL,
	"statement_end_date" timestamp NOT NULL,
	"total_transactions" integer NOT NULL,
	"successful_imports" integer NOT NULL,
	"failed_imports" integer NOT NULL,
	"duplicate_transactions" integer NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"error_log" text,
	"imported_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"value_date" timestamp,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"running_balance" numeric(15, 2),
	"description" text NOT NULL,
	"reference" varchar(255),
	"check_number" varchar(50),
	"payee" varchar(255),
	"category" varchar(100),
	"reconciliation_status" "reconciliation_status" DEFAULT 'unreconciled' NOT NULL,
	"reconciled_date" timestamp,
	"gl_entry_id" uuid,
	"is_cleared" boolean DEFAULT false NOT NULL,
	"cleared_date" timestamp,
	"imported_from" varchar(50),
	"original_data" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_transfer_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"description" text,
	"from_bank_account_id" uuid NOT NULL,
	"to_bank_account_id" uuid,
	"external_bank_name" varchar(255),
	"external_account_number" varchar(100),
	"external_routing_number" varchar(50),
	"beneficiary_name" varchar(255),
	"transfer_type" varchar(20) NOT NULL,
	"default_amount" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" varchar(100) NOT NULL,
	"template_id" uuid,
	"from_bank_account_id" uuid NOT NULL,
	"to_bank_account_id" uuid,
	"external_bank_name" varchar(255),
	"external_account_number" varchar(100),
	"external_routing_number" varchar(50),
	"beneficiary_name" varchar(255),
	"transfer_type" varchar(20) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"fee_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"value_date" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"reference" varchar(255),
	"purpose" text,
	"notes" text,
	"bank_reference" varchar(255),
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_flow_forecast_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forecast_id" uuid NOT NULL,
	"item_date" timestamp NOT NULL,
	"item_type" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"projected_amount" numeric(15, 2) NOT NULL,
	"actual_amount" numeric(15, 2),
	"variance" numeric(15, 2),
	"confidence" varchar(20) DEFAULT 'medium' NOT NULL,
	"source" varchar(100),
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_flow_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forecast_name" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"opening_balance" numeric(15, 2) NOT NULL,
	"projected_closing_balance" numeric(15, 2) NOT NULL,
	"actual_closing_balance" numeric(15, 2),
	"variance" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_gateway_id" uuid NOT NULL,
	"gateway_transaction_id" varchar(255) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"fee_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"payer_name" varchar(255),
	"payer_email" varchar(255),
	"payment_date" timestamp NOT NULL,
	"settlement_date" timestamp,
	"refund_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"refund_date" timestamp,
	"invoice_id" uuid,
	"customer_id" uuid,
	"description" text,
	"gateway_response" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway_name" varchar(100) NOT NULL,
	"gateway_type" "payment_gateway" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"api_key" varchar(255),
	"secret_key" varchar(255),
	"webhook_url" varchar(500),
	"supported_currencies" text,
	"transaction_fee_percent" numeric(5, 4),
	"transaction_fee_fixed" numeric(10, 2),
	"settlement_delay" integer DEFAULT 2 NOT NULL,
	"configuration" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reconciliation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reconciliation_id" uuid NOT NULL,
	"bank_transaction_id" uuid,
	"gl_entry_id" uuid,
	"item_type" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"is_cleared" boolean DEFAULT false NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"abbreviation" varchar(10) NOT NULL,
	"default_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"settings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_communication_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"preferred_channel" varchar(50) DEFAULT 'EMAIL',
	"email_opt_in" boolean DEFAULT true NOT NULL,
	"sms_opt_in" boolean DEFAULT false NOT NULL,
	"marketing_opt_in" boolean DEFAULT true NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"designation" varchar(100),
	"department" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_portal_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"contact_id" uuid,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"permissions" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_segment_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"assigned_date" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"criteria" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_code" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_type" varchar(50) DEFAULT 'Individual',
	"parent_customer_id" uuid,
	"company_id" uuid NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"website" varchar(255),
	"tax_id" varchar(50),
	"currency" varchar(3) DEFAULT 'USD',
	"payment_terms" varchar(100),
	"credit_limit" numeric(15, 2) DEFAULT '0',
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_revaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"revaluation_number" varchar(50) NOT NULL,
	"revaluation_date" timestamp NOT NULL,
	"revaluation_method" varchar(50) NOT NULL,
	"previous_book_value" numeric(15, 2) NOT NULL,
	"new_fair_value" numeric(15, 2) NOT NULL,
	"revaluation_surplus" numeric(15, 2) NOT NULL,
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
	CONSTRAINT "asset_revaluations_revaluation_number_company_id_unique" UNIQUE("revaluation_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depreciation_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"depreciation_date" timestamp NOT NULL,
	"period_start_date" timestamp NOT NULL,
	"period_end_date" timestamp NOT NULL,
	"depreciation_amount" numeric(15, 2) NOT NULL,
	"accumulated_depreciation" numeric(15, 2) NOT NULL,
	"book_value" numeric(15, 2) NOT NULL,
	"tax_depreciation_amount" numeric(15, 2),
	"tax_accumulated_depreciation" numeric(15, 2),
	"tax_book_value" numeric(15, 2),
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
	CONSTRAINT "depreciation_entries_entry_number_company_id_unique" UNIQUE("entry_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depreciation_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	CONSTRAINT "depreciation_methods_method_code_company_id_unique" UNIQUE("method_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "depreciation_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"schedule_number" varchar(50) NOT NULL,
	"depreciation_method" varchar(50) NOT NULL,
	"useful_life" integer NOT NULL,
	"salvage_value" numeric(15, 2) DEFAULT '0',
	"asset_cost" numeric(15, 2) NOT NULL,
	"depreciable_amount" numeric(15, 2) NOT NULL,
	"depreciation_rate" numeric(5, 2),
	"units_of_production" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"tax_depreciation_method" varchar(50),
	"tax_useful_life" integer,
	"tax_salvage_value" numeric(15, 2),
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
	CONSTRAINT "depreciation_schedules_schedule_number_company_id_unique" UNIQUE("schedule_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"parent_department_id" uuid,
	"head_of_department_id" uuid,
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"level" integer DEFAULT 1,
	"department_id" uuid,
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_number" varchar(100),
	"file_path" varchar(500),
	"file_size" integer,
	"mime_type" varchar(100),
	"expiry_date" date,
	"is_verified" boolean DEFAULT false,
	"verified_by" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"onboarding_template_id" uuid,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"start_date" date NOT NULL,
	"expected_completion_date" date,
	"actual_completion_date" date,
	"assigned_to_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_onboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"assigned_to_id" uuid,
	"due_date" date,
	"completed_date" date,
	"completed_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"email" varchar(255),
	"phone" varchar(20),
	"personal_email" varchar(255),
	"date_of_birth" date,
	"gender" varchar(10),
	"marital_status" varchar(20),
	"nationality" varchar(50),
	"date_of_joining" date NOT NULL,
	"date_of_leaving" date,
	"employment_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"department_id" uuid,
	"designation_id" uuid,
	"reports_to_id" uuid,
	"company_id" uuid NOT NULL,
	"current_address" jsonb,
	"permanent_address" jsonb,
	"emergency_contact" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"description" text,
	"assigned_role" varchar(100),
	"days_from_start" integer DEFAULT 0,
	"is_required" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"department_id" uuid,
	"designation_id" uuid,
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "energy_consumption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" varchar(100) NOT NULL,
	"meter_type" varchar(50) NOT NULL,
	"location_id" varchar(100) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"device_id" uuid,
	"consumption" numeric(15, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"cost" numeric(15, 2),
	"currency" varchar(3),
	"tariff_rate" numeric(10, 6),
	"peak_hours" boolean DEFAULT false,
	"carbon_footprint" numeric(15, 4),
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "environmental_monitoring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" varchar(100) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"monitoring_type" varchar(100) NOT NULL,
	"device_id" uuid,
	"value" numeric(15, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"quality_index" numeric(5, 2),
	"status" varchar(50) DEFAULT 'normal' NOT NULL,
	"alert_threshold" numeric(15, 4),
	"regulatory_limit" numeric(15, 4),
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equipment_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" varchar(100) NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" numeric(15, 4) NOT NULL,
	"unit" varchar(20),
	"status" varchar(20) DEFAULT 'normal',
	"alert_threshold" numeric(15, 4),
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iot_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid,
	"sensor_id" uuid,
	"alert_type" varchar(100) NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"status" "alert_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"trigger_value" numeric(15, 4),
	"threshold_value" numeric(15, 4),
	"metadata" jsonb,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iot_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"device_type" varchar(100) NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"firmware_version" varchar(50),
	"status" "device_status" DEFAULT 'inactive' NOT NULL,
	"location" jsonb,
	"configuration" jsonb,
	"metadata" jsonb,
	"last_seen" timestamp with time zone,
	"asset_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "iot_devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iot_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"gateway_id" varchar(100) NOT NULL,
	"protocol" varchar(50) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"port" varchar(10),
	"username" varchar(100),
	"password" varchar(255),
	"certificate_path" varchar(500),
	"configuration" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_heartbeat" timestamp with time zone,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "iot_gateways_gateway_id_unique" UNIQUE("gateway_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iot_sensor_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"sensor_type" varchar(50) NOT NULL,
	"measurement_type" varchar(50) NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"unit" varchar(20),
	"location" jsonb,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "iot_sensors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"sensor_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sensor_type" "sensor_type" NOT NULL,
	"unit" varchar(20),
	"min_value" numeric(15, 4),
	"max_value" numeric(15, 4),
	"accuracy" numeric(10, 6),
	"resolution" numeric(10, 6),
	"calibration_date" timestamp with time zone,
	"next_calibration_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "predictive_maintenance_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"model_type" varchar(100) NOT NULL,
	"algorithm" varchar(100) NOT NULL,
	"target_variable" varchar(100) NOT NULL,
	"features" jsonb NOT NULL,
	"hyperparameters" jsonb,
	"training_data" jsonb,
	"model_path" varchar(500),
	"accuracy" numeric(5, 4),
	"precision" numeric(5, 4),
	"recall" numeric(5, 4),
	"f1_score" numeric(5, 4),
	"is_active" boolean DEFAULT false NOT NULL,
	"last_trained_at" timestamp with time zone,
	"next_training_at" timestamp with time zone,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "predictive_maintenance_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"device_id" uuid,
	"prediction_type" varchar(100) NOT NULL,
	"predicted_value" numeric(15, 4) NOT NULL,
	"confidence" numeric(5, 4),
	"features" jsonb,
	"metadata" jsonb,
	"predicted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "item_attribute_unique" UNIQUE("item_id","attribute_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"price_list" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"rate" numeric(15, 2) NOT NULL,
	"valid_from" timestamp,
	"valid_upto" timestamp,
	"min_qty" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"price_list" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"customer_id" uuid,
	"min_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"max_qty" numeric(15, 2),
	"rate" numeric(15, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"valid_from" timestamp NOT NULL,
	"valid_upto" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_item_id" uuid NOT NULL,
	"variant_item_id" uuid NOT NULL,
	"variant_attributes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"item_group" varchar(100),
	"category_id" uuid,
	"description" text,
	"item_type" varchar(50) DEFAULT 'Stock',
	"has_variants" boolean DEFAULT false NOT NULL,
	"template_item_id" uuid,
	"current_stage" varchar(50) DEFAULT 'Introduction',
	"discontinued_date" timestamp,
	"replacement_item_id" uuid,
	"stock_uom" varchar(20) NOT NULL,
	"sales_uom" varchar(20),
	"purchase_uom" varchar(20),
	"sales_uom_conversion_factor" numeric(15, 6) DEFAULT '1',
	"purchase_uom_conversion_factor" numeric(15, 6) DEFAULT '1',
	"standard_rate" numeric(15, 2) DEFAULT '0',
	"valuation_rate" numeric(15, 2) DEFAULT '0',
	"last_purchase_rate" numeric(15, 2) DEFAULT '0',
	"is_stock_item" boolean DEFAULT true NOT NULL,
	"has_serial_no" boolean DEFAULT false NOT NULL,
	"has_batch_no" boolean DEFAULT false NOT NULL,
	"has_expiry_date" boolean DEFAULT false NOT NULL,
	"inspection_required" boolean DEFAULT false NOT NULL,
	"quality_inspection_template" varchar(100),
	"reorder_level" numeric(15, 2) DEFAULT '0',
	"reorder_qty" numeric(15, 2) DEFAULT '0',
	"min_order_qty" numeric(15, 2) DEFAULT '1',
	"max_order_qty" numeric(15, 2),
	"lead_time_days" integer DEFAULT 0,
	"weight" numeric(15, 3),
	"weight_uom" varchar(20),
	"length" numeric(15, 3),
	"width" numeric(15, 3),
	"height" numeric(15, 3),
	"dimension_uom" varchar(20),
	"tax_category" varchar(100),
	"income_account" varchar(100),
	"expense_account" varchar(100),
	"cogs_account" varchar(100),
	"asset_account" varchar(100),
	"brand" varchar(100),
	"manufacturer" varchar(100),
	"manufacturer_part_no" varchar(100),
	"country_of_origin" varchar(3),
	"hs_code" varchar(20),
	"barcode" varchar(100),
	"barcode_type" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sales_item" boolean DEFAULT true NOT NULL,
	"is_purchase_item" boolean DEFAULT true NOT NULL,
	"is_fixed_asset" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "items_code_company_unique" UNIQUE("item_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"actual_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"reserved_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"ordered_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"planned_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"valuation_rate" numeric(15, 2) DEFAULT '0',
	"stock_value" numeric(15, 2) DEFAULT '0',
	"company_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"cost_type" varchar(50) NOT NULL,
	"description" text,
	"quantity" numeric(15, 6),
	"unit_cost" numeric(15, 2),
	"total_cost" numeric(15, 2) NOT NULL,
	"labor_hours" numeric(8, 2),
	"hourly_rate" numeric(15, 2),
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
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"work_order_id" uuid,
	"maintenance_date" timestamp NOT NULL,
	"maintenance_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"downtime" integer,
	"mtbf" integer,
	"mttr" integer,
	"total_cost" numeric(15, 2),
	"labor_hours" numeric(8, 2),
	"labor_cost" numeric(15, 2),
	"material_cost" numeric(15, 2),
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
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"estimated_cost" numeric(15, 2),
	"status" varchar(50) DEFAULT 'Active',
	"is_active" boolean DEFAULT true NOT NULL,
	"notification_lead_time" integer,
	"notify_users" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "maintenance_schedules_schedule_code_company_id_unique" UNIQUE("schedule_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"estimated_cost" numeric(15, 2),
	"actual_cost" numeric(15, 2),
	"labor_cost" numeric(15, 2),
	"material_cost" numeric(15, 2),
	"external_service_cost" numeric(15, 2),
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
	CONSTRAINT "maintenance_work_orders_work_order_number_company_id_unique" UNIQUE("work_order_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spare_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"unit_cost" numeric(15, 2),
	"last_purchase_price" numeric(15, 2),
	"average_cost" numeric(15, 2),
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
	CONSTRAINT "spare_parts_part_code_company_id_unique" UNIQUE("part_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bom_alternative_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_item_id" uuid NOT NULL,
	"alternative_item_id" uuid NOT NULL,
	"alternative_item_code" varchar(100) NOT NULL,
	"alternative_item_name" varchar(255) NOT NULL,
	"conversion_factor" numeric(15, 6) DEFAULT '1',
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bom_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"qty" numeric(15, 6) NOT NULL,
	"uom" varchar(50) NOT NULL,
	"rate" numeric(15, 2) DEFAULT '0',
	"base_rate" numeric(15, 2) DEFAULT '0',
	"amount" numeric(15, 2) DEFAULT '0',
	"base_amount" numeric(15, 2) DEFAULT '0',
	"stock_qty" numeric(15, 6) DEFAULT '0',
	"stock_uom" varchar(50),
	"conversion_factor" numeric(15, 6) DEFAULT '1',
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bom_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"operation_no" varchar(50) NOT NULL,
	"operation_name" varchar(255) NOT NULL,
	"description" text,
	"workstation_id" uuid,
	"workstation_type" varchar(100),
	"time_in_mins" numeric(15, 2) DEFAULT '0',
	"operating_cost" numeric(15, 2) DEFAULT '0',
	"base_operating_cost" numeric(15, 2) DEFAULT '0',
	"hour_rate" numeric(15, 2) DEFAULT '0',
	"base_hour_rate" numeric(15, 2) DEFAULT '0',
	"batch_size" integer DEFAULT 1,
	"fixed_time_in_mins" numeric(15, 2) DEFAULT '0',
	"set_up_time" numeric(15, 2) DEFAULT '0',
	"tear_down_time" numeric(15, 2) DEFAULT '0',
	"sequence_id" integer DEFAULT 0,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bom_scrap_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"stock_qty" numeric(15, 6) DEFAULT '0',
	"rate" numeric(15, 2) DEFAULT '0',
	"amount" numeric(15, 2) DEFAULT '0',
	"base_rate" numeric(15, 2) DEFAULT '0',
	"base_amount" numeric(15, 2) DEFAULT '0',
	"stock_uom" varchar(50),
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_no" varchar(50) NOT NULL,
	"item_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"description" text,
	"quantity" numeric(15, 6) DEFAULT '1' NOT NULL,
	"uom" varchar(50) NOT NULL,
	"operating_cost" numeric(15, 2) DEFAULT '0',
	"raw_material_cost" numeric(15, 2) DEFAULT '0',
	"total_cost" numeric(15, 2) DEFAULT '0',
	"bom_type" varchar(50) DEFAULT 'Manufacturing' NOT NULL,
	"with_operations" boolean DEFAULT false,
	"transfer_material_against" varchar(50) DEFAULT 'Work Order',
	"allow_alternative_item" boolean DEFAULT false,
	"allow_same_item_multiple_times" boolean DEFAULT false,
	"set_rate_of_sub_assembly_item_based_on_bom" boolean DEFAULT true,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"price_list_rate" numeric(15, 2) DEFAULT '0',
	"base_raw_material_cost" numeric(15, 2) DEFAULT '0',
	"base_operating_cost" numeric(15, 2) DEFAULT '0',
	"base_total_cost" numeric(15, 2) DEFAULT '0',
	"inspection_required" boolean DEFAULT false,
	"quality_inspection_template" varchar(255),
	"project_id" uuid,
	"routing_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capacity_plan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capacity_plan_id" uuid NOT NULL,
	"workstation_id" uuid NOT NULL,
	"workstation_name" varchar(255) NOT NULL,
	"planning_date" timestamp NOT NULL,
	"available_capacity" numeric(15, 2) DEFAULT '0',
	"planned_capacity" numeric(15, 2) DEFAULT '0',
	"capacity_utilization" numeric(5, 2) DEFAULT '0',
	"overload_hours" numeric(15, 2) DEFAULT '0',
	"underload_hours" numeric(15, 2) DEFAULT '0',
	"capacity_uom" varchar(50) DEFAULT 'Hours',
	"source_document" varchar(255),
	"source_document_id" uuid,
	"operation_id" uuid,
	"operation_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capacity_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_name" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"workstation_id" uuid,
	"include_work_orders" boolean DEFAULT true,
	"include_production_plans" boolean DEFAULT true,
	"include_maintenance_schedule" boolean DEFAULT false,
	"capacity_uom" varchar(50) DEFAULT 'Hours',
	"run_start_time" timestamp,
	"run_end_time" timestamp,
	"error_log" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mrp_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrp_run_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"warehouse_id" uuid,
	"required_date" timestamp NOT NULL,
	"planned_order_date" timestamp,
	"planned_order_receipt" timestamp,
	"gross_requirement" numeric(15, 6) DEFAULT '0',
	"scheduled_receipts" numeric(15, 6) DEFAULT '0',
	"projected_available_balance" numeric(15, 6) DEFAULT '0',
	"net_requirement" numeric(15, 6) DEFAULT '0',
	"planned_order_quantity" numeric(15, 6) DEFAULT '0',
	"uom" varchar(50) NOT NULL,
	"lead_time_days" integer DEFAULT 0,
	"safety_stock" numeric(15, 6) DEFAULT '0',
	"min_order_qty" numeric(15, 6) DEFAULT '0',
	"max_order_qty" numeric(15, 6) DEFAULT '0',
	"order_multiple" numeric(15, 6) DEFAULT '1',
	"action_required" varchar(100),
	"source_document" varchar(255),
	"source_document_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mrp_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_name" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"include_non_stock_items" boolean DEFAULT false,
	"include_subcontracted_items" boolean DEFAULT false,
	"ignore_existing_ordered_qty" boolean DEFAULT false,
	"consider_min_order_qty" boolean DEFAULT false,
	"consider_safety_stock" boolean DEFAULT true,
	"warehouse_id" uuid,
	"item_group_id" uuid,
	"buyer_id" uuid,
	"project_id" uuid,
	"run_start_time" timestamp,
	"run_end_time" timestamp,
	"error_log" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forecast_name" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"forecast_date" timestamp NOT NULL,
	"forecast_quantity" numeric(15, 6) NOT NULL,
	"uom" varchar(50) NOT NULL,
	"warehouse_id" uuid,
	"sales_order_id" uuid,
	"forecast_type" varchar(50) DEFAULT 'Manual',
	"confidence_level" numeric(5, 2) DEFAULT '0',
	"seasonal_factor" numeric(5, 4) DEFAULT '1',
	"trend_factor" numeric(5, 4) DEFAULT '1',
	"actual_quantity" numeric(15, 6) DEFAULT '0',
	"variance" numeric(15, 6) DEFAULT '0',
	"variance_percentage" numeric(5, 2) DEFAULT '0',
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_plan_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"bom_id" uuid,
	"bom_no" varchar(50),
	"planned_qty" numeric(15, 6) NOT NULL,
	"pending_qty" numeric(15, 6) DEFAULT '0',
	"produced_qty" numeric(15, 6) DEFAULT '0',
	"uom" varchar(50) NOT NULL,
	"warehouse_id" uuid,
	"planned_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"description" text,
	"sales_order_id" uuid,
	"sales_order_item" varchar(100),
	"material_request_id" uuid,
	"work_order_id" uuid,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_name" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"description" text,
	"get_items_from_open_sales_orders" boolean DEFAULT false,
	"download_materials_required" boolean DEFAULT false,
	"ignore_existing_ordered_qty" boolean DEFAULT false,
	"consider_min_order_qty" boolean DEFAULT false,
	"include_non_stock_items" boolean DEFAULT false,
	"include_subcontracted_items" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"description" text,
	"source_warehouse_id" uuid,
	"required_qty" numeric(15, 6) NOT NULL,
	"transferred_qty" numeric(15, 6) DEFAULT '0',
	"consumed_qty" numeric(15, 6) DEFAULT '0',
	"returned_qty" numeric(15, 6) DEFAULT '0',
	"available_qty_at_source_warehouse" numeric(15, 6) DEFAULT '0',
	"available_qty_at_wip_warehouse" numeric(15, 6) DEFAULT '0',
	"uom" varchar(50) NOT NULL,
	"stock_uom" varchar(50),
	"conversion_factor" numeric(15, 6) DEFAULT '1',
	"rate" numeric(15, 2) DEFAULT '0',
	"amount" numeric(15, 2) DEFAULT '0',
	"bom_item_id" uuid,
	"operation_id" uuid,
	"allow_alternative_item" boolean DEFAULT false,
	"include_item_in_manufacturing" boolean DEFAULT true,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"operation_id" uuid,
	"operation_no" varchar(50) NOT NULL,
	"operation_name" varchar(255) NOT NULL,
	"description" text,
	"workstation_id" uuid,
	"workstation_type" varchar(100),
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"planned_operating_cost" numeric(15, 2) DEFAULT '0',
	"actual_operating_cost" numeric(15, 2) DEFAULT '0',
	"time_in_mins" numeric(15, 2) DEFAULT '0',
	"actual_time_in_mins" numeric(15, 2) DEFAULT '0',
	"hour_rate" numeric(15, 2) DEFAULT '0',
	"batch_size" integer DEFAULT 1,
	"completed_qty" numeric(15, 6) DEFAULT '0',
	"process_loss_qty" numeric(15, 6) DEFAULT '0',
	"planned_start_time" timestamp,
	"planned_end_time" timestamp,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"sequence_id" integer DEFAULT 0,
	"idx" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"stock_entry_type" varchar(50) NOT NULL,
	"stock_entry_id" uuid,
	"purpose" varchar(100) NOT NULL,
	"from_warehouse_id" uuid,
	"to_warehouse_id" uuid,
	"total_outgoing_value" numeric(15, 2) DEFAULT '0',
	"total_incoming_value" numeric(15, 2) DEFAULT '0',
	"total_additional_costs" numeric(15, 2) DEFAULT '0',
	"posting_date" timestamp NOT NULL,
	"posting_time" varchar(10),
	"is_submitted" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_order_time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"operation_id" uuid,
	"employee_id" uuid,
	"employee_name" varchar(255),
	"from_time" timestamp NOT NULL,
	"to_time" timestamp,
	"time_in_mins" numeric(15, 2) DEFAULT '0',
	"completed_qty" numeric(15, 6) DEFAULT '0',
	"operation_name" varchar(255),
	"workstation_id" uuid,
	"is_completed" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_no" varchar(50) NOT NULL,
	"company_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"bom_id" uuid,
	"bom_no" varchar(50),
	"production_plan_id" uuid,
	"sales_order_id" uuid,
	"sales_order_item" varchar(100),
	"qty_to_manufacture" numeric(15, 6) NOT NULL,
	"manufactured_qty" numeric(15, 6) DEFAULT '0',
	"pending_qty" numeric(15, 6) DEFAULT '0',
	"uom" varchar(50) NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"source_warehouse_id" uuid,
	"wip_warehouse_id" uuid,
	"fg_warehouse_id" uuid,
	"scrap_warehouse_id" uuid,
	"planned_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"expected_delivery_date" timestamp,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"priority" varchar(20) DEFAULT 'Medium',
	"description" text,
	"project_id" uuid,
	"transfer_material_against" varchar(50) DEFAULT 'Work Order',
	"use_multi_level_bom" boolean DEFAULT true,
	"skip_transfer" boolean DEFAULT false,
	"allow_alternative_item" boolean DEFAULT false,
	"required_items" jsonb,
	"total_operating_cost" numeric(15, 2) DEFAULT '0',
	"total_raw_material_cost" numeric(15, 2) DEFAULT '0',
	"additional_operating_cost" numeric(15, 2) DEFAULT '0',
	"scrap_warehouse_required" boolean DEFAULT false,
	"batch_size" numeric(15, 6) DEFAULT '1',
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workstations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workstation_name" varchar(255) NOT NULL,
	"workstation_type" varchar(100),
	"company_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"description" text,
	"hour_rate" numeric(15, 2) DEFAULT '0',
	"hour_rate_electricity" numeric(15, 2) DEFAULT '0',
	"hour_rate_consumable" numeric(15, 2) DEFAULT '0',
	"hour_rate_rent" numeric(15, 2) DEFAULT '0',
	"hour_rate_labour" numeric(15, 2) DEFAULT '0',
	"production_capacity" numeric(15, 2) DEFAULT '1',
	"working_hours_start" varchar(10),
	"working_hours_end" varchar(10),
	"holiday_list" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"configuration" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(500),
	"body_template" text NOT NULL,
	"variables" jsonb,
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"recipient_id" uuid NOT NULL,
	"sender_id" uuid,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"read_at" timestamp,
	"metadata" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"activity_date" timestamp NOT NULL,
	"duration" integer,
	"outcome" varchar(100),
	"next_action" varchar(255),
	"next_action_date" timestamp,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_assignment_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"assign_to" uuid NOT NULL,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_campaign_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"current_step" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'Active',
	"completed_at" timestamp,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_nurturing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_criteria" jsonb NOT NULL,
	"workflow" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp,
	"end_date" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_scoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"points" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_code" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"job_title" varchar(100),
	"industry" varchar(100),
	"website" varchar(255),
	"address" jsonb,
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'New' NOT NULL,
	"score" integer DEFAULT 0,
	"qualification_notes" text,
	"assigned_to" uuid,
	"territory" varchar(100),
	"estimated_value" numeric(15, 2),
	"expected_close_date" timestamp,
	"last_contact_date" timestamp,
	"next_follow_up_date" timestamp,
	"notes" text,
	"custom_fields" jsonb,
	"is_converted" boolean DEFAULT false,
	"converted_customer_id" uuid,
	"converted_opportunity_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_lead_code_unique" UNIQUE("lead_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"customer_id" uuid,
	"lead_id" uuid,
	"stage" "opportunity_stage" DEFAULT 'Prospecting' NOT NULL,
	"probability" integer DEFAULT 0,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"source" "lead_source",
	"description" text,
	"next_step" varchar(255),
	"assigned_to" uuid,
	"territory" varchar(100),
	"competitor_info" jsonb,
	"lost_reason" varchar(255),
	"custom_fields" jsonb,
	"template_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_opportunity_code_unique" UNIQUE("opportunity_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"activity_date" timestamp NOT NULL,
	"duration" integer,
	"outcome" varchar(100),
	"next_action" varchar(255),
	"next_action_date" timestamp,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"competitor_name" varchar(255) NOT NULL,
	"strengths" text,
	"weaknesses" text,
	"pricing" numeric(15, 2),
	"win_probability" integer,
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"from_stage" "opportunity_stage",
	"to_stage" "opportunity_stage" NOT NULL,
	"probability" integer,
	"amount" numeric(15, 2),
	"notes" text,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"access_level" varchar(50) DEFAULT 'Read',
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by" uuid NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_template_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"activity_name" varchar(255) NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false,
	"days_from_stage_start" integer,
	"estimated_duration" integer,
	"assigned_role" varchar(100),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_template_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"stage_name" varchar(100) NOT NULL,
	"stage_order" integer NOT NULL,
	"default_probability" integer NOT NULL,
	"required_activities" jsonb,
	"exit_criteria" jsonb,
	"average_duration" integer,
	"is_required" boolean DEFAULT true,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"product_line" varchar(100),
	"industry" varchar(100),
	"deal_type" varchar(50) NOT NULL,
	"average_deal_size" numeric(15, 2),
	"average_sales_cycle" integer,
	"custom_fields" jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pos_invoice_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"barcode" varchar(100),
	"quantity" numeric(15, 4) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"tax_percent" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"line_total" numeric(15, 2) NOT NULL,
	"serial_numbers" jsonb,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_code" varchar(50) NOT NULL,
	"pos_profile_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"customer_email" varchar(255),
	"invoice_date" timestamp NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0',
	"total_discount" numeric(15, 2) DEFAULT '0',
	"grand_total" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) NOT NULL,
	"change_amount" numeric(15, 2) DEFAULT '0',
	"payment_methods" jsonb,
	"loyalty_points_earned" integer DEFAULT 0,
	"loyalty_points_redeemed" integer DEFAULT 0,
	"notes" text,
	"is_synced" boolean DEFAULT false,
	"synced_at" timestamp,
	"cashier_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_invoices_invoice_code_unique" UNIQUE("invoice_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"warehouse_id" uuid NOT NULL,
	"cash_account" uuid NOT NULL,
	"income_account" uuid NOT NULL,
	"expense_account" uuid NOT NULL,
	"cost_center" varchar(100),
	"currency" varchar(3) DEFAULT 'USD',
	"price_list" varchar(100),
	"allow_discount" boolean DEFAULT true,
	"max_discount" numeric(5, 2) DEFAULT '0',
	"allow_credit_sale" boolean DEFAULT false,
	"allow_return" boolean DEFAULT true,
	"print_receipt" boolean DEFAULT true,
	"email_receipt" boolean DEFAULT false,
	"offline_mode" boolean DEFAULT false,
	"loyalty_program" varchar(100),
	"is_active" boolean DEFAULT true,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"description" text,
	"quantity" numeric(15, 4) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"tax_percent" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"line_total" numeric(15, 2) NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_code" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"status" "quotation_status" DEFAULT 'Draft' NOT NULL,
	"valid_until" timestamp NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000',
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0',
	"total_discount" numeric(15, 2) DEFAULT '0',
	"grand_total" numeric(15, 2) NOT NULL,
	"terms" text,
	"notes" text,
	"internal_notes" text,
	"assigned_to" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_code_unique" UNIQUE("quotation_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"description" text,
	"quantity" numeric(15, 4) NOT NULL,
	"delivered_quantity" numeric(15, 4) DEFAULT '0',
	"invoiced_quantity" numeric(15, 4) DEFAULT '0',
	"unit_price" numeric(15, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"tax_percent" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"line_total" numeric(15, 2) NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_code" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"quotation_id" uuid,
	"opportunity_id" uuid,
	"status" "sales_order_status" DEFAULT 'Draft' NOT NULL,
	"order_date" timestamp NOT NULL,
	"delivery_date" timestamp,
	"currency" varchar(3) DEFAULT 'USD',
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000',
	"subtotal" numeric(15, 2) NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0',
	"total_discount" numeric(15, 2) DEFAULT '0',
	"shipping_charges" numeric(15, 2) DEFAULT '0',
	"grand_total" numeric(15, 2) NOT NULL,
	"advance_amount" numeric(15, 2) DEFAULT '0',
	"balance_amount" numeric(15, 2),
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"terms" text,
	"notes" text,
	"internal_notes" text,
	"assigned_to" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"confirmed_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_orders_sales_order_code_unique" UNIQUE("sales_order_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_period" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"target_value" numeric(15, 2) NOT NULL,
	"achieved_value" numeric(15, 2) DEFAULT '0',
	"assigned_to" uuid,
	"territory" varchar(100),
	"product_category" varchar(100),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"permissions" jsonb,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"assessment_date" timestamp NOT NULL,
	"assessor" uuid NOT NULL,
	"scope" text,
	"overall_score" integer,
	"status" varchar(50) NOT NULL,
	"recommendations" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"requirement_id" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb,
	"remediation" jsonb,
	"due_date" timestamp,
	"status" varchar(50) NOT NULL,
	"assignee" varchar(255),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_breaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"affected_records" integer NOT NULL,
	"data_categories" jsonb,
	"cause" text NOT NULL,
	"discovered_at" timestamp NOT NULL,
	"reported_at" timestamp,
	"contained_at" timestamp,
	"resolved_at" timestamp,
	"notification_required" boolean DEFAULT false,
	"authority_notified" boolean DEFAULT false,
	"subjects_notified" boolean DEFAULT false,
	"company_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"remediation" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_processing_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"purpose" text NOT NULL,
	"legal_basis" varchar(50) NOT NULL,
	"data_categories" jsonb,
	"recipients" jsonb,
	"retention_period" integer NOT NULL,
	"cross_border_transfer" boolean DEFAULT false,
	"safeguards" jsonb,
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject_id" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"request_date" timestamp NOT NULL,
	"completion_date" timestamp,
	"description" text,
	"response" text,
	"documents" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"company_id" uuid NOT NULL,
	"consent_status" jsonb,
	"data_categories" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "privacy_impact_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"processing_activity" varchar(255) NOT NULL,
	"risk_level" varchar(20) NOT NULL,
	"data_types" jsonb,
	"risks" jsonb,
	"mitigations" jsonb,
	"status" varchar(50) NOT NULL,
	"assessor" uuid NOT NULL,
	"reviewer" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component" varchar(100) NOT NULL,
	"setting" varchar(100) NOT NULL,
	"current_value" jsonb,
	"recommended_value" jsonb,
	"severity" varchar(20) NOT NULL,
	"description" text,
	"remediation" text,
	"company_id" uuid NOT NULL,
	"last_checked" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"source" varchar(100) NOT NULL,
	"user_id" uuid,
	"company_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_detections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threat_id" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"confidence" integer NOT NULL,
	"source_ip" varchar(45),
	"user_id" uuid,
	"company_id" uuid NOT NULL,
	"details" jsonb,
	"recommendations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"threat_level" varchar(20) NOT NULL,
	"source" varchar(100) NOT NULL,
	"description" text,
	"first_seen" timestamp NOT NULL,
	"last_seen" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threat_intelligence_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cve_id" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"cvss_score" integer,
	"category" varchar(50) NOT NULL,
	"component" varchar(255) NOT NULL,
	"version" varchar(50),
	"fixed_version" varchar(50),
	"status" varchar(50) NOT NULL,
	"discovered_at" timestamp NOT NULL,
	"fixed_at" timestamp,
	"references" jsonb,
	"remediation" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerability_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" varchar(100) NOT NULL,
	"scan_type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vulnerability_scans_scan_id_unique" UNIQUE("scan_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"warehouse_id" uuid,
	"location_id" uuid,
	"qty_change" numeric(15, 2) DEFAULT '0' NOT NULL,
	"qty_before" numeric(15, 2) DEFAULT '0',
	"qty_after" numeric(15, 2) DEFAULT '0',
	"document_type" varchar(50),
	"document_number" varchar(50),
	"document_id" uuid,
	"reason" varchar(100),
	"notes" text,
	"created_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"reserved_qty" numeric(15, 2) DEFAULT '0',
	"last_transaction_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "batch_locations_unique" UNIQUE("batch_id","warehouse_id","location_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"item_id" uuid NOT NULL,
	"manufacturing_date" timestamp,
	"expiry_date" timestamp,
	"supplier_batch_id" varchar(100),
	"supplier_id" uuid,
	"purchase_document_type" varchar(50),
	"purchase_document_number" varchar(50),
	"manufacturing_location" varchar(255),
	"quality_status" varchar(50) DEFAULT 'Approved' NOT NULL,
	"quality_inspection_date" timestamp,
	"quality_inspector" uuid,
	"quality_notes" text,
	"total_qty" numeric(15, 2) DEFAULT '0' NOT NULL,
	"available_qty" numeric(15, 2) DEFAULT '0',
	"reserved_qty" numeric(15, 2) DEFAULT '0',
	"consumed_qty" numeric(15, 2) DEFAULT '0',
	"uom" varchar(20) NOT NULL,
	"batch_attributes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "batch_numbers_unique" UNIQUE("batch_number","item_id","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_number" varchar(50) NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"report_title" varchar(255) NOT NULL,
	"reporting_period_from" timestamp NOT NULL,
	"reporting_period_to" timestamp NOT NULL,
	"regulatory_body" varchar(255),
	"regulation_reference" varchar(100),
	"report_data" jsonb NOT NULL,
	"affected_items" jsonb,
	"affected_batches" jsonb,
	"affected_serials" jsonb,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_reports_number_company_unique" UNIQUE("report_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_recalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recall_number" varchar(50) NOT NULL,
	"recall_title" varchar(255) NOT NULL,
	"recall_type" varchar(50) NOT NULL,
	"severity_level" varchar(50) NOT NULL,
	"recall_reason" text NOT NULL,
	"recall_date" timestamp NOT NULL,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"regulatory_body" varchar(255),
	"regulatory_reference" varchar(100),
	"affected_items" jsonb NOT NULL,
	"affected_batches" jsonb,
	"affected_serials" jsonb,
	"date_range_from" timestamp,
	"date_range_to" timestamp,
	"customer_notification_required" boolean DEFAULT true NOT NULL,
	"supplier_notification_required" boolean DEFAULT false NOT NULL,
	"recall_instructions" text,
	"contact_information" jsonb,
	"total_affected_qty" numeric(15, 2) DEFAULT '0',
	"recovered_qty" numeric(15, 2) DEFAULT '0',
	"destroyed_qty" numeric(15, 2) DEFAULT '0',
	"returned_qty" numeric(15, 2) DEFAULT '0',
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_recalls_number_company_unique" UNIQUE("recall_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quality_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_number" varchar(50) NOT NULL,
	"inspection_type" varchar(50) NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"serial_number_id" uuid,
	"inspection_date" timestamp NOT NULL,
	"inspector_id" uuid NOT NULL,
	"inspection_template" varchar(100),
	"sample_size" numeric(15, 2),
	"total_qty_inspected" numeric(15, 2),
	"passed_qty" numeric(15, 2) DEFAULT '0',
	"failed_qty" numeric(15, 2) DEFAULT '0',
	"overall_status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"inspection_results" jsonb,
	"defects_found" jsonb,
	"corrective_actions" text,
	"inspector_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"warehouse_id" uuid,
	"location_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quality_inspections_number_company_unique" UNIQUE("inspection_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recall_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recall_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"serial_number_id" uuid,
	"customer_id" uuid,
	"warehouse_id" uuid,
	"location_id" uuid,
	"qty_affected" numeric(15, 2) DEFAULT '0',
	"qty_recovered" numeric(15, 2) DEFAULT '0',
	"recovery_status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"recovery_date" timestamp,
	"recovery_method" varchar(50),
	"customer_notified" boolean DEFAULT false NOT NULL,
	"notification_date" timestamp,
	"notification_method" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serial_number_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serial_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"status" varchar(50) DEFAULT 'Available' NOT NULL,
	"condition" varchar(50) DEFAULT 'Good' NOT NULL,
	"purchase_date" timestamp,
	"purchase_rate" numeric(15, 2) DEFAULT '0',
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_numbers_unique" UNIQUE("serial_number","company_id")
);
--> statement-breakpoint
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
	"total_value" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"purpose" varchar(100),
	"remarks" text,
	"is_gl_posted" boolean DEFAULT false NOT NULL,
	"gl_posting_date" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_entries_number_company_unique" UNIQUE("entry_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_entry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_entry_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"qty" numeric(15, 2) NOT NULL,
	"uom" varchar(20) NOT NULL,
	"conversion_factor" numeric(15, 6) DEFAULT '1',
	"stock_uom_qty" numeric(15, 2) NOT NULL,
	"serial_numbers" jsonb,
	"batch_numbers" jsonb,
	"has_serial_no" boolean DEFAULT false NOT NULL,
	"has_batch_no" boolean DEFAULT false NOT NULL,
	"valuation_rate" numeric(15, 2) DEFAULT '0',
	"amount" numeric(15, 2) DEFAULT '0',
	"quality_inspection" varchar(100),
	"inspection_required" boolean DEFAULT false NOT NULL,
	"quality_status" varchar(50) DEFAULT 'Accepted',
	"remarks" text,
	"actual_qty_before" numeric(15, 2) DEFAULT '0',
	"actual_qty_after" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"actual_qty" numeric(15, 2) DEFAULT '0',
	"qty_after_transaction" numeric(15, 2) DEFAULT '0',
	"incoming_rate" numeric(15, 2) DEFAULT '0',
	"valuation_rate" numeric(15, 2) DEFAULT '0',
	"stock_value" numeric(15, 2) DEFAULT '0',
	"stock_value_difference" numeric(15, 2) DEFAULT '0',
	"serial_no" varchar(100),
	"batch_no" varchar(100),
	"reserved_qty" numeric(15, 2) DEFAULT '0',
	"reserved_stock" numeric(15, 2) DEFAULT '0',
	"project_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_reconciliation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reconciliation_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"location_id" uuid,
	"system_qty" numeric(15, 2) DEFAULT '0',
	"physical_qty" numeric(15, 2) DEFAULT '0',
	"variance_qty" numeric(15, 2) DEFAULT '0',
	"valuation_rate" numeric(15, 2) DEFAULT '0',
	"variance_value" numeric(15, 2) DEFAULT '0',
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reconciliation_number" varchar(50) NOT NULL,
	"reconciliation_date" timestamp NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"reconciliation_type" varchar(50) NOT NULL,
	"total_items_count" integer DEFAULT 0,
	"items_with_variance" integer DEFAULT 0,
	"total_variance_value" numeric(15, 2) DEFAULT '0',
	"purpose" varchar(100),
	"remarks" text,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_reconciliations_number_company_unique" UNIQUE("reconciliation_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"reservation_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_number" varchar(50) NOT NULL,
	"reference_id" uuid NOT NULL,
	"reserved_qty" numeric(15, 2) NOT NULL,
	"delivered_qty" numeric(15, 2) DEFAULT '0',
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"token_type" varchar(50),
	"scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"permissions" text[],
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"refresh_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"refresh_expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" varchar(32),
	"last_login_at" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_category_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_category_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"designation" varchar(100),
	"department" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"evaluation_date" timestamp NOT NULL,
	"evaluated_by" uuid NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"quality_score" numeric(5, 2),
	"delivery_score" numeric(5, 2),
	"cost_score" numeric(5, 2),
	"service_score" numeric(5, 2),
	"comments" text,
	"recommendations" text,
	"next_evaluation_date" timestamp,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"target" numeric(10, 2),
	"unit" varchar(20),
	"period" varchar(20) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_portal_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"contact_id" uuid,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"permissions" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_code" varchar(50) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"vendor_type" varchar(50) DEFAULT 'Company',
	"parent_vendor_id" uuid,
	"company_id" uuid NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"website" varchar(255),
	"tax_id" varchar(50),
	"currency" varchar(3) DEFAULT 'USD',
	"payment_terms" varchar(100),
	"credit_limit" numeric(15, 2) DEFAULT '0',
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_code" varchar(50) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"parent_location_id" uuid,
	"aisle" varchar(20),
	"rack" varchar(20),
	"shelf" varchar(20),
	"bin" varchar(20),
	"capacity" numeric(15, 2),
	"capacity_uom" varchar(20),
	"used_capacity" numeric(15, 2) DEFAULT '0',
	"length" numeric(15, 3),
	"width" numeric(15, 3),
	"height" numeric(15, 3),
	"dimension_uom" varchar(20),
	"barcode" varchar(100),
	"barcode_type" varchar(20),
	"location_type" varchar(50) DEFAULT 'Storage',
	"temperature_controlled" boolean DEFAULT false NOT NULL,
	"min_temperature" numeric(5, 2),
	"max_temperature" numeric(5, 2),
	"temperature_uom" varchar(10) DEFAULT 'C',
	"restricted_access" boolean DEFAULT false NOT NULL,
	"access_level" varchar(50),
	"is_group" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_locations_code_warehouse_unique" UNIQUE("location_code","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"metric_date" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"total_capacity_utilization" numeric(5, 2) DEFAULT '0',
	"average_capacity_utilization" numeric(5, 2) DEFAULT '0',
	"peak_capacity_utilization" numeric(5, 2) DEFAULT '0',
	"total_inbound_volume" numeric(15, 2) DEFAULT '0',
	"total_outbound_volume" numeric(15, 2) DEFAULT '0',
	"total_transfer_volume" numeric(15, 2) DEFAULT '0',
	"average_pick_time" numeric(10, 2) DEFAULT '0',
	"average_pack_time" numeric(10, 2) DEFAULT '0',
	"average_putaway_time" numeric(10, 2) DEFAULT '0',
	"pick_accuracy" numeric(5, 2) DEFAULT '100',
	"inventory_accuracy" numeric(5, 2) DEFAULT '100',
	"operating_cost_per_unit" numeric(15, 4) DEFAULT '0',
	"labor_cost_percentage" numeric(5, 2) DEFAULT '0',
	"damage_rate" numeric(5, 2) DEFAULT '0',
	"return_rate" numeric(5, 2) DEFAULT '0',
	"order_fulfillment_rate" numeric(5, 2) DEFAULT '100',
	"on_time_delivery_rate" numeric(5, 2) DEFAULT '100',
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_performance_unique" UNIQUE("warehouse_id","metric_date","period_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"requested_qty" numeric(15, 2) NOT NULL,
	"shipped_qty" numeric(15, 2) DEFAULT '0',
	"received_qty" numeric(15, 2) DEFAULT '0',
	"uom" varchar(20) NOT NULL,
	"serial_numbers" jsonb,
	"batch_numbers" jsonb,
	"condition" varchar(50) DEFAULT 'Good',
	"quality_notes" text,
	"unit_cost" numeric(15, 2) DEFAULT '0',
	"total_cost" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" varchar(50) NOT NULL,
	"from_warehouse_id" uuid NOT NULL,
	"to_warehouse_id" uuid NOT NULL,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"transfer_date" timestamp NOT NULL,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"tracking_number" varchar(100),
	"carrier" varchar(100),
	"shipping_cost" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"reason" varchar(100),
	"notes" text,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_transfers_number_company_unique" UNIQUE("transfer_number","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_code" varchar(50) NOT NULL,
	"warehouse_name" varchar(255) NOT NULL,
	"warehouse_type" varchar(50) DEFAULT 'Stock',
	"parent_warehouse_id" uuid,
	"company_id" uuid NOT NULL,
	"address" jsonb,
	"email" varchar(255),
	"phone" varchar(20),
	"total_capacity" numeric(15, 2),
	"capacity_uom" varchar(20),
	"used_capacity" numeric(15, 2) DEFAULT '0',
	"allow_negative_stock" boolean DEFAULT false NOT NULL,
	"auto_reorder_enabled" boolean DEFAULT false NOT NULL,
	"barcode_required" boolean DEFAULT false NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"operating_hours" jsonb,
	"is_group" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_company_unique" UNIQUE("warehouse_code","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid,
	"instance_id" uuid,
	"company_id" uuid NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_value" jsonb NOT NULL,
	"period" varchar(20) NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_id" uuid NOT NULL,
	"instance_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"decision" varchar(20),
	"comments" text,
	"reason" text,
	"delegated_to" uuid,
	"delegation_reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"context_data" jsonb,
	"current_step" varchar(100),
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_date" timestamp,
	"sla_breached" boolean DEFAULT false NOT NULL,
	"sla_breached_at" timestamp,
	"initiated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"step_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"assigned_role" varchar(100),
	"input_data" jsonb,
	"output_data" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_date" timestamp,
	"comments" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"industry" varchar(100),
	"definition" jsonb NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"definition" jsonb NOT NULL,
	"tags" jsonb,
	"permissions" jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_categories_parent_category_id_index" ON "asset_categories" ("parent_category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_disposals_asset_id_index" ON "asset_disposals" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_disposals_status_index" ON "asset_disposals" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_disposals_disposal_date_index" ON "asset_disposals" ("disposal_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_locations_parent_location_id_index" ON "asset_locations" ("parent_location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_locations_location_manager_id_index" ON "asset_locations" ("location_manager_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_transfers_asset_id_index" ON "asset_transfers" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_transfers_status_index" ON "asset_transfers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_transfers_transfer_date_index" ON "asset_transfers" ("transfer_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_serial_number_index" ON "assets" ("serial_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_barcode_index" ON "assets" ("barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_rfid_tag_index" ON "assets" ("rfid_tag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_status_index" ON "assets" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_asset_category_id_index" ON "assets" ("asset_category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_current_location_id_index" ON "assets" ("current_location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_custodian_id_index" ON "assets" ("custodian_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_revaluations_asset_id_index" ON "asset_revaluations" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_revaluations_revaluation_date_index" ON "asset_revaluations" ("revaluation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_revaluations_status_index" ON "asset_revaluations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_revaluations_is_posted_index" ON "asset_revaluations" ("is_posted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_entries_schedule_id_index" ON "depreciation_entries" ("schedule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_entries_depreciation_date_index" ON "depreciation_entries" ("depreciation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_entries_is_posted_index" ON "depreciation_entries" ("is_posted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_entries_gl_entry_id_index" ON "depreciation_entries" ("gl_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_methods_is_active_index" ON "depreciation_methods" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_schedules_asset_id_index" ON "depreciation_schedules" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_schedules_status_index" ON "depreciation_schedules" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_schedules_start_date_index" ON "depreciation_schedules" ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_energy_consumption_meter_timestamp" ON "energy_consumption" ("meter_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_energy_consumption_location_timestamp" ON "energy_consumption" ("location_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_energy_consumption_type_timestamp" ON "energy_consumption" ("meter_type","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_energy_consumption_company_id" ON "energy_consumption" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_env_monitoring_location_type" ON "environmental_monitoring" ("location_id","monitoring_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_env_monitoring_timestamp" ON "environmental_monitoring" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_env_monitoring_status" ON "environmental_monitoring" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_env_monitoring_company_id" ON "environmental_monitoring" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equipment_metrics_equipment_timestamp" ON "equipment_metrics" ("equipment_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equipment_metrics_metric_timestamp" ON "equipment_metrics" ("metric_name","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equipment_metrics_company_timestamp" ON "equipment_metrics" ("company_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_alerts_device_id" ON "iot_alerts" ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_alerts_severity" ON "iot_alerts" ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_alerts_status" ON "iot_alerts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_alerts_company_id" ON "iot_alerts" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_alerts_created_at" ON "iot_alerts" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_devices_device_id" ON "iot_devices" ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_devices_status" ON "iot_devices" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_devices_company_id" ON "iot_devices" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_devices_asset_id" ON "iot_devices" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_devices_last_seen" ON "iot_devices" ("last_seen");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_gateways_gateway_id" ON "iot_gateways" ("gateway_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_gateways_protocol" ON "iot_gateways" ("protocol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_gateways_company_id" ON "iot_gateways" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_gateways_active" ON "iot_gateways" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensor_data_device_timestamp" ON "iot_sensor_data" ("device_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensor_data_type_timestamp" ON "iot_sensor_data" ("sensor_type","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensor_data_company_timestamp" ON "iot_sensor_data" ("company_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensors_device_sensor" ON "iot_sensors" ("device_id","sensor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensors_type" ON "iot_sensors" ("sensor_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensors_company_id" ON "iot_sensors" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_iot_sensors_active" ON "iot_sensors" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_models_name" ON "predictive_maintenance_models" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_models_type" ON "predictive_maintenance_models" ("model_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_models_company_id" ON "predictive_maintenance_models" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_models_active" ON "predictive_maintenance_models" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_predictions_model_asset" ON "predictive_maintenance_predictions" ("model_id","asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_predictions_type" ON "predictive_maintenance_predictions" ("prediction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_predictions_predicted_at" ON "predictive_maintenance_predictions" ("predicted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_predictions_company_id" ON "predictive_maintenance_predictions" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_attribute_values_item_idx" ON "item_attribute_values" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_attribute_values_attribute_idx" ON "item_attribute_values" ("attribute_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_attributes_name_idx" ON "item_attributes" ("attribute_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_attributes_company_idx" ON "item_attributes" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_categories_code_idx" ON "item_categories" ("category_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_categories_company_idx" ON "item_categories" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_cross_references_item_idx" ON "item_cross_references" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_cross_references_reference_idx" ON "item_cross_references" ("reference_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_cross_references_type_idx" ON "item_cross_references" ("reference_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_documents_item_idx" ON "item_documents" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_documents_type_idx" ON "item_documents" ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_documents_primary_idx" ON "item_documents" ("item_id","is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_lifecycle_item_idx" ON "item_lifecycle" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_lifecycle_stage_idx" ON "item_lifecycle" ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_lifecycle_date_idx" ON "item_lifecycle" ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_item_idx" ON "item_pricing_tiers" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_price_list_idx" ON "item_pricing_tiers" ("price_list");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_customer_idx" ON "item_pricing_tiers" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_pricing_tiers_validity_idx" ON "item_pricing_tiers" ("valid_from","valid_upto");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_variants_template_idx" ON "item_variants" ("template_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_variants_variant_idx" ON "item_variants" ("variant_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_category_idx" ON "items" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_type_idx" ON "items" ("item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_stage_idx" ON "items" ("current_stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_barcode_idx" ON "items" ("barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_brand_idx" ON "items" ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_manufacturer_idx" ON "items" ("manufacturer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_company_idx" ON "items" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_work_order_id_index" ON "maintenance_costs" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_cost_type_index" ON "maintenance_costs" ("cost_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_cost_date_index" ON "maintenance_costs" ("cost_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_status_index" ON "maintenance_costs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_technician_id_index" ON "maintenance_costs" ("technician_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_costs_spare_part_id_index" ON "maintenance_costs" ("spare_part_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_history_asset_id_index" ON "maintenance_history" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_history_work_order_id_index" ON "maintenance_history" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_history_maintenance_date_index" ON "maintenance_history" ("maintenance_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_history_performed_by_index" ON "maintenance_history" ("performed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_asset_id_index" ON "maintenance_schedules" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_status_index" ON "maintenance_schedules" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_next_due_date_index" ON "maintenance_schedules" ("next_due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_priority_index" ON "maintenance_schedules" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_asset_id_index" ON "maintenance_work_orders" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_schedule_id_index" ON "maintenance_work_orders" ("schedule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_status_index" ON "maintenance_work_orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_priority_index" ON "maintenance_work_orders" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_assigned_to_id_index" ON "maintenance_work_orders" ("assigned_to_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_work_orders_scheduled_start_date_index" ON "maintenance_work_orders" ("scheduled_start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spare_parts_item_id_index" ON "spare_parts" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spare_parts_status_index" ON "spare_parts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spare_parts_manufacturer_part_number_index" ON "spare_parts" ("manufacturer_part_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_alt_items_bom_item_id" ON "bom_alternative_items" ("bom_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_alt_items_alt_item_id" ON "bom_alternative_items" ("alternative_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_items_bom_id" ON "bom_items" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_items_item_id" ON "bom_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_operations_bom_id" ON "bom_operations" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_operations_operation_no" ON "bom_operations" ("operation_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_operations_sequence" ON "bom_operations" ("sequence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_scrap_items_bom_id" ON "bom_scrap_items" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_scrap_items_item_id" ON "bom_scrap_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_update_log_bom_id" ON "bom_update_log" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_update_log_update_type" ON "bom_update_log" ("update_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_update_log_created_at" ON "bom_update_log" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_no" ON "boms" ("bom_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_item_id" ON "boms" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_company_id" ON "boms" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_version" ON "boms" ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bom_is_active" ON "boms" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_results_plan_id" ON "capacity_plan_results" ("capacity_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_results_workstation_id" ON "capacity_plan_results" ("workstation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_results_planning_date" ON "capacity_plan_results" ("planning_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_name" ON "capacity_plans" ("plan_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_company_id" ON "capacity_plans" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_status" ON "capacity_plans" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_from_date" ON "capacity_plans" ("from_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_to_date" ON "capacity_plans" ("to_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_capacity_plan_workstation_id" ON "capacity_plans" ("workstation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_results_run_id" ON "mrp_results" ("mrp_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_results_item_id" ON "mrp_results" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_results_warehouse_id" ON "mrp_results" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_results_required_date" ON "mrp_results" ("required_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_results_action_required" ON "mrp_results" ("action_required");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_run_name" ON "mrp_runs" ("run_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_run_company_id" ON "mrp_runs" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_run_status" ON "mrp_runs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_run_from_date" ON "mrp_runs" ("from_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mrp_run_to_date" ON "mrp_runs" ("to_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_forecast_name" ON "production_forecasts" ("forecast_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_forecast_company_id" ON "production_forecasts" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_forecast_item_id" ON "production_forecasts" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_forecast_date" ON "production_forecasts" ("forecast_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_forecast_type" ON "production_forecasts" ("forecast_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_items_plan_id" ON "production_plan_items" ("production_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_items_item_id" ON "production_plan_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_items_bom_id" ON "production_plan_items" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_items_warehouse_id" ON "production_plan_items" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_items_planned_start_date" ON "production_plan_items" ("planned_start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_name" ON "production_plans" ("plan_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_company_id" ON "production_plans" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_status" ON "production_plans" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_from_date" ON "production_plans" ("from_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_production_plan_to_date" ON "production_plans" ("to_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_items_work_order_id" ON "work_order_items" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_items_item_id" ON "work_order_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_items_source_warehouse_id" ON "work_order_items" ("source_warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_operations_work_order_id" ON "work_order_operations" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_operations_operation_no" ON "work_order_operations" ("operation_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_operations_workstation_id" ON "work_order_operations" ("workstation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_operations_status" ON "work_order_operations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_operations_sequence" ON "work_order_operations" ("sequence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_stock_entries_work_order_id" ON "work_order_stock_entries" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_stock_entries_type" ON "work_order_stock_entries" ("stock_entry_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_stock_entries_posting_date" ON "work_order_stock_entries" ("posting_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_time_logs_work_order_id" ON "work_order_time_logs" ("work_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_time_logs_operation_id" ON "work_order_time_logs" ("operation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_time_logs_employee_id" ON "work_order_time_logs" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_time_logs_from_time" ON "work_order_time_logs" ("from_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_no" ON "work_orders" ("work_order_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_company_id" ON "work_orders" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_item_id" ON "work_orders" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_bom_id" ON "work_orders" ("bom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_status" ON "work_orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_priority" ON "work_orders" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_planned_start_date" ON "work_orders" ("planned_start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_order_planned_end_date" ON "work_orders" ("planned_end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workstation_name" ON "workstations" ("workstation_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workstation_company_id" ON "workstations" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workstation_warehouse_id" ON "workstations" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_batch_idx" ON "batch_history" ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_transaction_idx" ON "batch_history" ("transaction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_date_idx" ON "batch_history" ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_warehouse_idx" ON "batch_history" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_document_idx" ON "batch_history" ("document_type","document_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_history_company_idx" ON "batch_history" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_locations_batch_idx" ON "batch_locations" ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_locations_warehouse_idx" ON "batch_locations" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_locations_location_idx" ON "batch_locations" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_item_idx" ON "batch_numbers" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_expiry_idx" ON "batch_numbers" ("expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_manufacturing_idx" ON "batch_numbers" ("manufacturing_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_quality_status_idx" ON "batch_numbers" ("quality_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_supplier_idx" ON "batch_numbers" ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_active_idx" ON "batch_numbers" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_numbers_company_idx" ON "batch_numbers" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_reports_type_idx" ON "compliance_reports" ("report_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_reports_status_idx" ON "compliance_reports" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_reports_period_idx" ON "compliance_reports" ("reporting_period_from","reporting_period_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_reports_submission_idx" ON "compliance_reports" ("submission_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_reports_company_idx" ON "compliance_reports" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_type_idx" ON "product_recalls" ("recall_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_severity_idx" ON "product_recalls" ("severity_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_status_idx" ON "product_recalls" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_date_idx" ON "product_recalls" ("recall_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_effective_idx" ON "product_recalls" ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_recalls_company_idx" ON "product_recalls" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_item_idx" ON "quality_inspections" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_batch_idx" ON "quality_inspections" ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_serial_idx" ON "quality_inspections" ("serial_number_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_type_idx" ON "quality_inspections" ("inspection_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_status_idx" ON "quality_inspections" ("overall_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_date_idx" ON "quality_inspections" ("inspection_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_inspector_idx" ON "quality_inspections" ("inspector_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quality_inspections_company_idx" ON "quality_inspections" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_recall_idx" ON "recall_items" ("recall_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_item_idx" ON "recall_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_batch_idx" ON "recall_items" ("batch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_serial_idx" ON "recall_items" ("serial_number_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_customer_idx" ON "recall_items" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recall_items_status_idx" ON "recall_items" ("recovery_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_number_history_serial_idx" ON "serial_number_history" ("serial_number_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_number_history_transaction_idx" ON "serial_number_history" ("transaction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_number_history_date_idx" ON "serial_number_history" ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_number_history_document_idx" ON "serial_number_history" ("document_type","document_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_number_history_company_idx" ON "serial_number_history" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_item_idx" ON "serial_numbers" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_warehouse_idx" ON "serial_numbers" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_location_idx" ON "serial_numbers" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_status_idx" ON "serial_numbers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_condition_idx" ON "serial_numbers" ("condition");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_customer_idx" ON "serial_numbers" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_supplier_idx" ON "serial_numbers" ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_warranty_idx" ON "serial_numbers" ("warranty_expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serial_numbers_company_idx" ON "serial_numbers" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_type_idx" ON "stock_entries" ("entry_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_warehouse_idx" ON "stock_entries" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_status_idx" ON "stock_entries" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_date_idx" ON "stock_entries" ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_reference_idx" ON "stock_entries" ("reference_type","reference_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entries_company_idx" ON "stock_entries" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entry_items_entry_idx" ON "stock_entry_items" ("stock_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entry_items_item_idx" ON "stock_entry_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entry_items_location_idx" ON "stock_entry_items" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_entry_items_batch_idx" ON "stock_entry_items" ("batch_numbers");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_item_warehouse_idx" ON "stock_ledger_entries" ("item_id","warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_voucher_idx" ON "stock_ledger_entries" ("voucher_type","voucher_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_posting_date_idx" ON "stock_ledger_entries" ("posting_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_serial_idx" ON "stock_ledger_entries" ("serial_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_batch_idx" ON "stock_ledger_entries" ("batch_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_ledger_company_idx" ON "stock_ledger_entries" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_reconciliation_idx" ON "stock_reconciliation_items" ("reconciliation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_item_idx" ON "stock_reconciliation_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_location_idx" ON "stock_reconciliation_items" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliation_items_variance_idx" ON "stock_reconciliation_items" ("variance_qty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliations_warehouse_idx" ON "stock_reconciliations" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliations_status_idx" ON "stock_reconciliations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliations_date_idx" ON "stock_reconciliations" ("reconciliation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reconciliations_company_idx" ON "stock_reconciliations" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reservations_item_warehouse_idx" ON "stock_reservations" ("item_id","warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reservations_reference_idx" ON "stock_reservations" ("reference_type","reference_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reservations_status_idx" ON "stock_reservations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reservations_expiry_idx" ON "stock_reservations" ("expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_reservations_company_idx" ON "stock_reservations" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_locations_warehouse_idx" ON "warehouse_locations" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_locations_parent_idx" ON "warehouse_locations" ("parent_location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_locations_type_idx" ON "warehouse_locations" ("location_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_locations_barcode_idx" ON "warehouse_locations" ("barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_performance_warehouse_idx" ON "warehouse_performance_metrics" ("warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_performance_date_idx" ON "warehouse_performance_metrics" ("metric_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_performance_period_idx" ON "warehouse_performance_metrics" ("period_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_performance_company_idx" ON "warehouse_performance_metrics" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfer_items_transfer_idx" ON "warehouse_transfer_items" ("transfer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfer_items_item_idx" ON "warehouse_transfer_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfers_from_warehouse_idx" ON "warehouse_transfers" ("from_warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfers_to_warehouse_idx" ON "warehouse_transfers" ("to_warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfers_status_idx" ON "warehouse_transfers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfers_date_idx" ON "warehouse_transfers" ("transfer_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouse_transfers_company_idx" ON "warehouse_transfers" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouses_type_idx" ON "warehouses" ("warehouse_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouses_parent_idx" ON "warehouses" ("parent_warehouse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouses_company_idx" ON "warehouses" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "warehouses_location_idx" ON "warehouses" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_analytics_workflow_id_idx" ON "workflow_analytics" ("workflow_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_analytics_metric_type_idx" ON "workflow_analytics" ("metric_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_analytics_date_idx" ON "workflow_analytics" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_approvals_step_id_idx" ON "workflow_approvals" ("step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_approvals_approver_id_idx" ON "workflow_approvals" ("approver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_approvals_status_idx" ON "workflow_approvals" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_instances_workflow_id_idx" ON "workflow_instances" ("workflow_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_instances_status_idx" ON "workflow_instances" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_instances_due_date_idx" ON "workflow_instances" ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_instances_sla_idx" ON "workflow_instances" ("sla_breached");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_steps_instance_id_idx" ON "workflow_steps" ("instance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_steps_status_idx" ON "workflow_steps" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_steps_assigned_to_idx" ON "workflow_steps" ("assigned_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_templates_category_idx" ON "workflow_templates" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_templates_public_idx" ON "workflow_templates" ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflows_company_id_idx" ON "workflows" ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflows_category_idx" ON "workflows" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflows_active_idx" ON "workflows" ("is_active");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_fiscal_year_id_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gl_entries" ADD CONSTRAINT "gl_entries_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gl_entries" ADD CONSTRAINT "gl_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gl_entries" ADD CONSTRAINT "gl_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_template_lines" ADD CONSTRAINT "journal_entry_template_lines_template_id_journal_entry_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "journal_entry_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_template_lines" ADD CONSTRAINT "journal_entry_template_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_template_lines" ADD CONSTRAINT "journal_entry_template_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entry_templates" ADD CONSTRAINT "journal_entry_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurring_journal_entries" ADD CONSTRAINT "recurring_journal_entries_template_id_journal_entry_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "journal_entry_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurring_journal_entries" ADD CONSTRAINT "recurring_journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "approval_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_step_id_approval_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "approval_workflow_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_current_step_id_approval_workflow_steps_id_fk" FOREIGN KEY ("current_step_id") REFERENCES "approval_workflow_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_bill_id_vendor_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "vendor_bills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_line_items" ADD CONSTRAINT "bill_line_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_numbering_series" ADD CONSTRAINT "bill_numbering_series_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_templates" ADD CONSTRAINT "bill_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_report_id_expense_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "expense_reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_payments" ADD CONSTRAINT "scheduled_payments_schedule_id_payment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "payment_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_payments" ADD CONSTRAINT "scheduled_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "three_way_matching" ADD CONSTRAINT "three_way_matching_bill_id_vendor_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "vendor_bills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "three_way_matching" ADD CONSTRAINT "three_way_matching_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_template_id_bill_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "bill_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_payment_allocations" ADD CONSTRAINT "vendor_payment_allocations_payment_id_vendor_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "vendor_payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_payment_allocations" ADD CONSTRAINT "vendor_payment_allocations_bill_id_vendor_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "vendor_bills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_payment_allocations" ADD CONSTRAINT "vendor_payment_allocations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_limit_checks" ADD CONSTRAINT "credit_limit_checks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_limit_checks" ADD CONSTRAINT "credit_limit_checks_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_limit_checks" ADD CONSTRAINT "credit_limit_checks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_statements" ADD CONSTRAINT "customer_statements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_statements" ADD CONSTRAINT "customer_statements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_configurations" ADD CONSTRAINT "dunning_configurations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_levels" ADD CONSTRAINT "dunning_levels_configuration_id_dunning_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "dunning_configurations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_levels" ADD CONSTRAINT "dunning_levels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_records" ADD CONSTRAINT "dunning_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_records" ADD CONSTRAINT "dunning_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dunning_records" ADD CONSTRAINT "dunning_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_numbering_series" ADD CONSTRAINT "invoice_numbering_series_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_invoice_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "invoice_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_customer_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "customer_payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("depreciation_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_accumulated_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_location_manager_id_users_id_fk" FOREIGN KEY ("location_manager_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_from_location_id_asset_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "asset_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_to_location_id_asset_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "asset_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_from_custodian_id_users_id_fk" FOREIGN KEY ("from_custodian_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_to_custodian_id_users_id_fk" FOREIGN KEY ("to_custodian_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_category_id_asset_categories_id_fk" FOREIGN KEY ("asset_category_id") REFERENCES "asset_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_current_location_id_asset_locations_id_fk" FOREIGN KEY ("current_location_id") REFERENCES "asset_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_custodian_id_users_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_statement_imports" ADD CONSTRAINT "bank_statement_imports_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_statement_imports" ADD CONSTRAINT "bank_statement_imports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfer_templates" ADD CONSTRAINT "bank_transfer_templates_from_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("from_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfer_templates" ADD CONSTRAINT "bank_transfer_templates_to_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("to_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfer_templates" ADD CONSTRAINT "bank_transfer_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_template_id_bank_transfer_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "bank_transfer_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_from_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("from_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_to_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("to_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_flow_forecast_items" ADD CONSTRAINT "cash_flow_forecast_items_forecast_id_cash_flow_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "cash_flow_forecasts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_flow_forecast_items" ADD CONSTRAINT "cash_flow_forecast_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online_payments" ADD CONSTRAINT "online_payments_payment_gateway_id_payment_gateways_id_fk" FOREIGN KEY ("payment_gateway_id") REFERENCES "payment_gateways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online_payments" ADD CONSTRAINT "online_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_gateways" ADD CONSTRAINT "payment_gateways_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_reconciliation_id_bank_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "bank_reconciliations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "bank_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_communication_preferences" ADD CONSTRAINT "customer_communication_preferences_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_communication_preferences" ADD CONSTRAINT "customer_communication_preferences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_portal_users" ADD CONSTRAINT "customer_portal_users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_portal_users" ADD CONSTRAINT "customer_portal_users_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "customer_contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_portal_users" ADD CONSTRAINT "customer_portal_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_segment_memberships" ADD CONSTRAINT "customer_segment_memberships_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_segment_memberships" ADD CONSTRAINT "customer_segment_memberships_segment_id_customer_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_segment_memberships" ADD CONSTRAINT "customer_segment_memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_segments" ADD CONSTRAINT "customer_segments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_revaluation_surplus_account_id_accounts_id_fk" FOREIGN KEY ("revaluation_surplus_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_revaluations" ADD CONSTRAINT "asset_revaluations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_schedule_id_depreciation_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "depreciation_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_reversed_by_users_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_methods" ADD CONSTRAINT "depreciation_methods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_methods" ADD CONSTRAINT "depreciation_methods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_methods" ADD CONSTRAINT "depreciation_methods_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_asset_account_id_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_depreciation_expense_account_id_accounts_id_fk" FOREIGN KEY ("depreciation_expense_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_accumulated_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_head_of_department_id_employees_id_fk" FOREIGN KEY ("head_of_department_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "designations" ADD CONSTRAINT "designations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "designations" ADD CONSTRAINT "designations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_verified_by_employees_id_fk" FOREIGN KEY ("verified_by") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_onboarding_template_id_onboarding_templates_id_fk" FOREIGN KEY ("onboarding_template_id") REFERENCES "onboarding_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding_tasks" ADD CONSTRAINT "employee_onboarding_tasks_onboarding_id_employee_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "employee_onboarding"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding_tasks" ADD CONSTRAINT "employee_onboarding_tasks_task_id_onboarding_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "onboarding_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding_tasks" ADD CONSTRAINT "employee_onboarding_tasks_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_onboarding_tasks" ADD CONSTRAINT "employee_onboarding_tasks_completed_by_employees_id_fk" FOREIGN KEY ("completed_by") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_reports_to_id_employees_id_fk" FOREIGN KEY ("reports_to_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_template_id_onboarding_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "onboarding_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_consumption" ADD CONSTRAINT "energy_consumption_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_consumption" ADD CONSTRAINT "energy_consumption_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "environmental_monitoring" ADD CONSTRAINT "environmental_monitoring_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "equipment_metrics" ADD CONSTRAINT "equipment_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_sensor_id_iot_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "iot_sensors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_gateways" ADD CONSTRAINT "iot_gateways_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_sensor_data" ADD CONSTRAINT "iot_sensor_data_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_sensors" ADD CONSTRAINT "iot_sensors_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "iot_sensors" ADD CONSTRAINT "iot_sensors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_models" ADD CONSTRAINT "predictive_maintenance_models_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_models" ADD CONSTRAINT "predictive_maintenance_models_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_predictions" ADD CONSTRAINT "predictive_maintenance_predictions_model_id_predictive_maintenance_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "predictive_maintenance_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_predictions" ADD CONSTRAINT "predictive_maintenance_predictions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_predictions" ADD CONSTRAINT "predictive_maintenance_predictions_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictive_maintenance_predictions" ADD CONSTRAINT "predictive_maintenance_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_attribute_values" ADD CONSTRAINT "item_attribute_values_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_attribute_values" ADD CONSTRAINT "item_attribute_values_attribute_id_item_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "item_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_attributes" ADD CONSTRAINT "item_attributes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_cross_references" ADD CONSTRAINT "item_cross_references_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_cross_references" ADD CONSTRAINT "item_cross_references_reference_item_id_items_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_lifecycle" ADD CONSTRAINT "item_lifecycle_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_lifecycle" ADD CONSTRAINT "item_lifecycle_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_prices" ADD CONSTRAINT "item_prices_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_pricing_tiers" ADD CONSTRAINT "item_pricing_tiers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_variants" ADD CONSTRAINT "item_variants_template_item_id_items_id_fk" FOREIGN KEY ("template_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_variants" ADD CONSTRAINT "item_variants_variant_item_id_items_id_fk" FOREIGN KEY ("variant_item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "item_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_work_order_id_maintenance_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "maintenance_work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_costs" ADD CONSTRAINT "maintenance_costs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_work_order_id_maintenance_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "maintenance_work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_schedule_id_maintenance_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_alternative_items" ADD CONSTRAINT "bom_alternative_items_bom_item_id_bom_items_id_fk" FOREIGN KEY ("bom_item_id") REFERENCES "bom_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_alternative_items" ADD CONSTRAINT "bom_alternative_items_alternative_item_id_items_id_fk" FOREIGN KEY ("alternative_item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_operations" ADD CONSTRAINT "bom_operations_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_scrap_items" ADD CONSTRAINT "bom_scrap_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_scrap_items" ADD CONSTRAINT "bom_scrap_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_update_log" ADD CONSTRAINT "bom_update_log_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_update_log" ADD CONSTRAINT "bom_update_log_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boms" ADD CONSTRAINT "boms_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boms" ADD CONSTRAINT "boms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boms" ADD CONSTRAINT "boms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_plan_results" ADD CONSTRAINT "capacity_plan_results_capacity_plan_id_capacity_plans_id_fk" FOREIGN KEY ("capacity_plan_id") REFERENCES "capacity_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_plan_results" ADD CONSTRAINT "capacity_plan_results_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_plans" ADD CONSTRAINT "capacity_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_plans" ADD CONSTRAINT "capacity_plans_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_plans" ADD CONSTRAINT "capacity_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_results" ADD CONSTRAINT "mrp_results_mrp_run_id_mrp_runs_id_fk" FOREIGN KEY ("mrp_run_id") REFERENCES "mrp_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_results" ADD CONSTRAINT "mrp_results_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_results" ADD CONSTRAINT "mrp_results_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_runs" ADD CONSTRAINT "mrp_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_runs" ADD CONSTRAINT "mrp_runs_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mrp_runs" ADD CONSTRAINT "mrp_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_forecasts" ADD CONSTRAINT "production_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_forecasts" ADD CONSTRAINT "production_forecasts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_forecasts" ADD CONSTRAINT "production_forecasts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_forecasts" ADD CONSTRAINT "production_forecasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plan_items" ADD CONSTRAINT "production_plan_items_production_plan_id_production_plans_id_fk" FOREIGN KEY ("production_plan_id") REFERENCES "production_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plan_items" ADD CONSTRAINT "production_plan_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plan_items" ADD CONSTRAINT "production_plan_items_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plan_items" ADD CONSTRAINT "production_plan_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_stock_entries" ADD CONSTRAINT "work_order_stock_entries_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_stock_entries" ADD CONSTRAINT "work_order_stock_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_operation_id_work_order_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "work_order_operations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_workstation_id_workstations_id_fk" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_order_time_logs" ADD CONSTRAINT "work_order_time_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_bom_id_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workstations" ADD CONSTRAINT "workstations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workstations" ADD CONSTRAINT "workstations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_assignment_rules" ADD CONSTRAINT "lead_assignment_rules_assign_to_users_id_fk" FOREIGN KEY ("assign_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_assignment_rules" ADD CONSTRAINT "lead_assignment_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_campaign_enrollments" ADD CONSTRAINT "lead_campaign_enrollments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_campaign_enrollments" ADD CONSTRAINT "lead_campaign_enrollments_campaign_id_lead_nurturing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "lead_nurturing_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_campaign_enrollments" ADD CONSTRAINT "lead_campaign_enrollments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_nurturing_campaigns" ADD CONSTRAINT "lead_nurturing_campaigns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_template_id_opportunity_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "opportunity_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_competitors" ADD CONSTRAINT "opportunity_competitors_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_competitors" ADD CONSTRAINT "opportunity_competitors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_team_members" ADD CONSTRAINT "opportunity_team_members_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_team_members" ADD CONSTRAINT "opportunity_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_team_members" ADD CONSTRAINT "opportunity_team_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_team_members" ADD CONSTRAINT "opportunity_team_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_template_activities" ADD CONSTRAINT "opportunity_template_activities_template_id_opportunity_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "opportunity_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_template_activities" ADD CONSTRAINT "opportunity_template_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_template_stages" ADD CONSTRAINT "opportunity_template_stages_template_id_opportunity_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "opportunity_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_template_stages" ADD CONSTRAINT "opportunity_template_stages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_templates" ADD CONSTRAINT "opportunity_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity_templates" ADD CONSTRAINT "opportunity_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoice_items" ADD CONSTRAINT "pos_invoice_items_pos_invoice_id_pos_invoices_id_fk" FOREIGN KEY ("pos_invoice_id") REFERENCES "pos_invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoice_items" ADD CONSTRAINT "pos_invoice_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoices" ADD CONSTRAINT "pos_invoices_pos_profile_id_pos_profiles_id_fk" FOREIGN KEY ("pos_profile_id") REFERENCES "pos_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoices" ADD CONSTRAINT "pos_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoices" ADD CONSTRAINT "pos_invoices_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_invoices" ADD CONSTRAINT "pos_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_profiles" ADD CONSTRAINT "pos_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_assessor_users_id_fk" FOREIGN KEY ("assessor") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_findings" ADD CONSTRAINT "compliance_findings_assessment_id_compliance_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "compliance_assessments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_findings" ADD CONSTRAINT "compliance_findings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_breaches" ADD CONSTRAINT "data_breaches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_processing_activities" ADD CONSTRAINT "data_processing_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_subjects" ADD CONSTRAINT "data_subjects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_impact_assessments" ADD CONSTRAINT "privacy_impact_assessments_assessor_users_id_fk" FOREIGN KEY ("assessor") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_impact_assessments" ADD CONSTRAINT "privacy_impact_assessments_reviewer_users_id_fk" FOREIGN KEY ("reviewer") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_impact_assessments" ADD CONSTRAINT "privacy_impact_assessments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_configurations" ADD CONSTRAINT "security_configurations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_events" ADD CONSTRAINT "security_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threat_detections" ADD CONSTRAINT "threat_detections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threat_detections" ADD CONSTRAINT "threat_detections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_history" ADD CONSTRAINT "batch_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_locations" ADD CONSTRAINT "batch_locations_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_quality_inspector_users_id_fk" FOREIGN KEY ("quality_inspector") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_numbers" ADD CONSTRAINT "batch_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_recall_id_product_recalls_id_fk" FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_batch_id_batch_numbers_id_fk" FOREIGN KEY ("batch_id") REFERENCES "batch_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recall_items" ADD CONSTRAINT "recall_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_serial_number_id_serial_numbers_id_fk" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_from_customer_id_customers_id_fk" FOREIGN KEY ("from_customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_to_customer_id_customers_id_fk" FOREIGN KEY ("to_customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_stock_entry_id_stock_entries_id_fk" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_reconciliation_id_stock_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "stock_reconciliations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_categories" ADD CONSTRAINT "vendor_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_category_memberships" ADD CONSTRAINT "vendor_category_memberships_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_category_memberships" ADD CONSTRAINT "vendor_category_memberships_category_id_vendor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "vendor_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_category_memberships" ADD CONSTRAINT "vendor_category_memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_evaluations" ADD CONSTRAINT "vendor_evaluations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_evaluations" ADD CONSTRAINT "vendor_evaluations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_performance_metrics" ADD CONSTRAINT "vendor_performance_metrics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_performance_metrics" ADD CONSTRAINT "vendor_performance_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_portal_users" ADD CONSTRAINT "vendor_portal_users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_portal_users" ADD CONSTRAINT "vendor_portal_users_contact_id_vendor_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "vendor_contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendor_portal_users" ADD CONSTRAINT "vendor_portal_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_performance_metrics" ADD CONSTRAINT "warehouse_performance_metrics_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_performance_metrics" ADD CONSTRAINT "warehouse_performance_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfer_items" ADD CONSTRAINT "warehouse_transfer_items_transfer_id_warehouse_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "warehouse_transfers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfer_items" ADD CONSTRAINT "warehouse_transfer_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_analytics" ADD CONSTRAINT "workflow_analytics_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_analytics" ADD CONSTRAINT "workflow_analytics_instance_id_workflow_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_analytics" ADD CONSTRAINT "workflow_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_step_id_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_instance_id_workflow_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_delegated_to_users_id_fk" FOREIGN KEY ("delegated_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_instance_id_workflow_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
