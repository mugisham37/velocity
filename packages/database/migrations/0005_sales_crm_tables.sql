-- Create enums for Sales & CRM module
CREATE TYPE lead_status AS ENUM (
  'New',
  'Contacted
'Qualified',
  'Proposal',
  'Negotiation',
  'Converted',
  'Lost',
  'Unqualified'
);

CREATE TYPE lead_source AS ENUM (
  'Website',
  'Email Campaign',
  'Social Media',
  'Referral',
  'Cold Call',
  'Trade Show',
  'Advertisement',
  'Partner',
  'Other'
);

CREATE TYPE opportunity_stage AS ENUM (
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
);

CREATE TYPE sales_order_status AS ENUM (
  'Draft',
  'Pending Approval',
  'Approved',
  'Confirmed',
  'Partially Delivered',
  'Delivered',
  'Partially Invoiced',
  'Invoiced',
  'Cancelled',
  'On Hold'
);

CREATE TYPE quotation_status AS ENUM (
  'Draft',
  'Sent',
  'Expired',
  'Accepted',
  'Rejected',
  'Cancelled'
);

-- Lead Management Tables
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_code VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(100),
  industry VARCHAR(100),
  website VARCHAR(255),
  address JSONB,
  source lead_source NOT NULL,
  status lead_status NOT NULL DEFAULT 'New',
  score INTEGER DEFAULT 0,
  qualification_notes TEXT,
  assigned_to UUID REFERENCES users(id),
  territory VARCHAR(100),
  estimated_value DECIMAL(15,2),
  expected_close_date TIMESTAMP,
  last_contact_date TIMESTAMP,
  next_follow_up_date TIMESTAMP,
  notes TEXT,
  custom_fields JSONB,
  is_converted BOOLEAN DEFAULT FALSE,
  converted_customer_id UUID REFERENCES customers(id),
  converted_opportunity_id UUID,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMP NOT NULL,
  duration INTEGER,
  outcome VARCHAR(100),
  next_action VARCHAR(255),
  next_action_date TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE lead_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  assign_to UUID NOT NULL REFERENCES users(id),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE lead_nurturing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_criteria JSONB NOT NULL,
  workflow JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE lead_campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  campaign_id UUID NOT NULL REFERENCES lead_nurturing_campaigns(id),
  enrolled_at TIMESTAMP DEFAULT NOW() NOT NULL,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  completed_at TIMESTAMP,
  company_id UUID NOT NULL REFERENCES companies(id)
);

-- Opportunity Management Tables
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  stage opportunity_stage NOT NULL DEFAULT 'Prospecting',
  probability INTEGER DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  expected_close_date TIMESTAMP,
  actual_close_date TIMESTAMP,
  source lead_source,
  description TEXT,
  next_step VARCHAR(255),
  assigned_to UUID REFERENCES users(id),
  territory VARCHAR(100),
  competitor_info JSONB,
  lost_reason VARCHAR(255),
  custom_fields JSONB,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  from_stage opportunity_stage,
  to_stage opportunity_stage NOT NULL,
  probability INTEGER,
  amount DECIMAL(15,2),
  notes TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id)
);

CREATE TABLE opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMP NOT NULL,
  duration INTEGER,
  outcome VARCHAR(100),
  next_action VARCHAR(255),
  next_action_date TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE opportunity_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  competitor_name VARCHAR(255) NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  pricing DECIMAL(15,2),
  win_probability INTEGER,
  notes TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE opportunity_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(100) NOT NULL,
  access_level VARCHAR(50) DEFAULT 'Read',
  added_at TIMESTAMP DEFAULT NOW() NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id)
);

-- Sales Order Management Tables
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_code VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  status quotation_status NOT NULL DEFAULT 'Draft',
  valid_until TIMESTAMP NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  subtotal DECIMAL(15,2) NOT NULL,
  total_tax DECIMAL(15,2) DEFAULT 0,
  total_discount DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL,
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,4) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  company_id UUID NOT NULL REFERENCES companies(id)
);

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_code VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  quotation_id UUID REFERENCES quotations(id),
  opportunity_id UUID REFERENCES opportunities(id),
  status sales_order_status NOT NULL DEFAULT 'Draft',
  order_date TIMESTAMP NOT NULL,
  delivery_date TIMESTAMP,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  subtotal DECIMAL(15,2) NOT NULL,
  total_tax DECIMAL(15,2) DEFAULT 0,
  total_discount DECIMAL(15,2) DEFAULT 0,
  shipping_charges DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL,
  advance_amount DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2),
  billing_address JSONB,
  shipping_address JSONB,
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,4) NOT NULL,
  delivered_quantity DECIMAL(15,4) DEFAULT 0,
  invoiced_quantity DECIMAL(15,4) DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  company_id UUID NOT NULL REFERENCES companies(id)
);

-- Point of Sale Tables
CREATE TABLE pos_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  warehouse_id UUID NOT NULL,
  cash_account UUID NOT NULL,
  income_account UUID NOT NULL,
  expense_account UUID NOT NULL,
  cost_center VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  price_list VARCHAR(100),
  allow_discount BOOLEAN DEFAULT TRUE,
  max_discount DECIMAL(5,2) DEFAULT 0,
  allow_credit_sale BOOLEAN DEFAULT FALSE,
  allow_return BOOLEAN DEFAULT TRUE,
  print_receipt BOOLEAN DEFAULT TRUE,
  email_receipt BOOLEAN DEFAULT FALSE,
  offline_mode BOOLEAN DEFAULT FALSE,
  loyalty_program VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE pos_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code VARCHAR(50) NOT NULL UNIQUE,
  pos_profile_id UUID NOT NULL REFERENCES pos_profiles(id),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  invoice_date TIMESTAMP NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  subtotal DECIMAL(15,2) NOT NULL,
  total_tax DECIMAL(15,2) DEFAULT 0,
  total_discount DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) NOT NULL,
  change_amount DECIMAL(15,2) DEFAULT 0,
  payment_methods JSONB,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_redeemed INTEGER DEFAULT 0,
  notes TEXT,
  is_synced BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP,
  cashier_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE pos_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_invoice_id UUID NOT NULL REFERENCES pos_invoices(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100),
  quantity DECIMAL(15,4) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  serial_numbers JSONB,
  company_id UUID NOT NULL REFERENCES companies(id)
);

-- Sales Analytics and Reporting Tables
CREATE TABLE sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_period VARCHAR(50) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_value DECIMAL(15,2) NOT NULL,
  achieved_value DECIMAL(15,2) DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  territory VARCHAR(100),
  product_category VARCHAR(100),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_company_id ON lead_activities(company_id);
CREATE INDEX idx_lead_activities_activity_date ON lead_activities(activity_date);

CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);

CREATE INDEX idx_opportunity_activities_opportunity_id ON opportunity_activities(opportunity_id);
CREATE INDEX idx_opportunity_activities_company_id ON opportunity_activities(company_id);

CREATE INDEX idx_quotations_company_id ON quotations(company_id);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

CREATE INDEX idx_sales_orders_company_id ON sales_orders(company_id);
CREATE INDEX idx_sales_orders_customer_id Oders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);

CREATE INDEX idx_pos_invoices_company_id ON pos_invoices(company_id);
CREATE INDEX idx_pos_invoices_pos_profile_id ON pos_invoices(pos_profile_id);
CREATE INDEX idx_pos_invoices_invoice_date ON pos_invoices(invoice_date);
CREATE INDEX idx_pos_invoices_is_synced ON pos_invoices(is_synced);

-- Add foreign key constraint for converted_opportunity_id in leads table
-- (This needs to be added after opportunities table is created)
ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_opportunity
  FOREIGN KEY (converted_opportunity_id) REFERENCES opportunities(id);
