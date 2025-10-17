// CRM Module Types

export interface Lead {
  name: string;
  lead_name: string;
  organization_lead?: boolean;
  company_name?: string;
  
  // Contact Information
  email_id?: string;
  phone?: string;
  mobile_no?: string;
  website?: string;
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  
  // Lead Details
  status: 'Open' | 'Replied' | 'Opportunity' | 'Quotation' | 'Lost Quotation' | 'Interested' | 'Converted' | 'Do Not Contact';
  source: string;
  lead_type: 'Client' | 'Channel Partner' | 'Consultant';
  market_segment?: string;
  industry?: string;
  
  // Qualification
  qualification_status?: 'Unqualified' | 'In Process' | 'Qualified';
  qualified_by?: string;
  qualification_date?: string;
  
  // Assignment
  lead_owner?: string;
  territory?: string;
  
  // Conversion
  customer?: string;
  converted_by?: string;
  conversion_date?: string;
  
  // Additional Information
  annual_revenue?: number;
  no_of_employees?: number;
  request_type?: string;
  notes?: string;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  disabled?: boolean;
}

export interface Opportunity {
  name: string;
  title?: string;
  opportunity_from: 'Lead' | 'Customer' | 'Prospect';
  party_name: string;
  customer_name?: string;
  
  // Opportunity Details
  opportunity_type: 'Sales' | 'Support' | 'Maintenance';
  source?: string;
  status: 'Open' | 'Quotation' | 'Reply' | 'Closed' | 'Lost' | 'Converted';
  sales_stage?: string;
  
  // Financial Information
  opportunity_amount?: number;
  probability?: number;
  currency?: string;
  exchange_rate?: number;
  
  // Dates
  transaction_date: string;
  expected_closing?: string;
  
  // Assignment
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  territory?: string;
  
  // Company Information
  company: string;
  
  // Conversion
  customer?: string;
  quotation?: string;
  
  // Additional Information
  notes?: string;
  next_contact_by?: string;
  next_contact_date?: string;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  
  // Items (for opportunity items)
  items?: OpportunityItem[];
}

export interface OpportunityItem {
  item_code: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  brand?: string;
  image?: string;
  
  // Quantity and Pricing
  qty: number;
  uom?: string;
  rate?: number;
  amount?: number;
  
  // Additional Information
  prevdoc_docname?: string;
  prevdoc_doctype?: string;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_type: 'Company' | 'Individual';
  customer_group: string;
  territory: string;
  
  // Contact Information
  email_id?: string;
  phone_no?: string;
  mobile_no?: string;
  website?: string;
  
  // Address Information
  customer_primary_address?: string;
  primary_address?: string;
  customer_primary_contact?: string;
  
  // Financial Information
  default_currency: string;
  default_price_list?: string;
  credit_limit?: number;
  payment_terms?: string;
  
  // Tax Information
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  
  // Settings
  so_required: boolean;
  dn_required: boolean;
  is_internal_customer: boolean;
  represents_company?: string;
  
  // Additional Information
  market_segment?: string;
  industry?: string;
  annual_revenue?: number;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  disabled: boolean;
}

export interface Contact {
  name: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  
  // Contact Information
  email_id?: string;
  phone?: string;
  mobile_no?: string;
  
  // Address Information
  address?: string;
  
  // Links
  links?: ContactLink[];
  
  // Additional Information
  designation?: string;
  department?: string;
  company_name?: string;
  
  // Status
  status: 'Passive' | 'Open' | 'Replied';
  unsubscribed: boolean;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export interface ContactLink {
  link_doctype: string;
  link_name: string;
  link_title?: string;
}

export interface Project {
  name: string;
  project_name: string;
  project_type?: string;
  
  // Dates
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Status
  status: 'Open' | 'Completed' | 'Cancelled' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  percent_complete?: number;
  
  // Financial
  estimated_costing?: number;
  total_costing_amount?: number;
  total_billable_amount?: number;
  total_billed_amount?: number;
  total_consumed_material_cost?: number;
  
  // Assignment
  project_manager?: string;
  
  // Company Information
  company: string;
  cost_center?: string;
  department?: string;
  
  // Customer Information
  customer?: string;
  sales_order?: string;
  
  // Additional Information
  notes?: string;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  
  // Tasks
  tasks?: Task[];
}

export interface Task {
  name: string;
  subject: string;
  project?: string;
  
  // Dates
  exp_start_date?: string;
  exp_end_date?: string;
  act_start_date?: string;
  act_end_date?: string;
  
  // Status and Priority
  status: 'Open' | 'Working' | 'Pending Review' | 'Overdue' | 'Template' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  progress?: number;
  
  // Assignment
  assigned_to?: string;
  
  // Time Tracking
  expected_time?: number;
  actual_time?: number;
  
  // Dependencies
  depends_on?: TaskDependency[];
  
  // Additional Information
  description?: string;
  
  // System Fields
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export interface TaskDependency {
  task: string;
  subject?: string;
}

// Form Data Types
export interface LeadFormData extends Omit<Lead, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  lead_name?: string;
  status?: Lead['status'];
  source?: string;
  lead_type?: Lead['lead_type'];
}

export interface OpportunityFormData extends Omit<Opportunity, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  title?: string;
  opportunity_from?: Opportunity['opportunity_from'];
  party_name?: string;
  opportunity_type?: Opportunity['opportunity_type'];
  status?: Opportunity['status'];
  transaction_date?: string;
}

export interface CustomerFormData extends Omit<Customer, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  customer_name?: string;
  customer_type?: Customer['customer_type'];
  customer_group?: string;
  territory?: string;
}

export interface ContactFormData extends Omit<Contact, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  first_name?: string;
  last_name?: string;
  status?: Contact['status'];
}

export interface ProjectFormData extends Omit<Project, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  project_name?: string;
  status?: Project['status'];
  priority?: Project['priority'];
}

export interface TaskFormData extends Omit<Task, 'name' | 'creation' | 'modified' | 'owner' | 'modified_by' | 'docstatus'> {
  subject?: string;
  status?: Task['status'];
  priority?: Task['priority'];
}

// API Response Types
export interface LeadListResponse {
  data: Lead[];
  total_count: number;
}

export interface OpportunityListResponse {
  data: Opportunity[];
  total_count: number;
}

export interface CustomerListResponse {
  data: Customer[];
  total_count: number;
}

export interface ContactListResponse {
  data: Contact[];
  total_count: number;
}

export interface ProjectListResponse {
  data: Project[];
  total_count: number;
}

export interface TaskListResponse {
  data: Task[];
  total_count: number;
}

// Analytics Types
export interface CRMAnalytics {
  lead_conversion_rate: number;
  opportunity_win_rate: number;
  average_deal_size: number;
  sales_cycle_length: number;
  pipeline_value: number;
  
  // Funnel Data
  leads_count: number;
  opportunities_count: number;
  quotations_count: number;
  customers_count: number;
  
  // Trend Data
  monthly_leads: Array<{ month: string; count: number }>;
  monthly_opportunities: Array<{ month: string; count: number; value: number }>;
  monthly_conversions: Array<{ month: string; count: number }>;
  
  // Source Analysis
  lead_sources: Array<{ source: string; count: number; conversion_rate: number }>;
  opportunity_sources: Array<{ source: string; count: number; value: number }>;
  
  // Territory Analysis
  territory_performance: Array<{ territory: string; leads: number; opportunities: number; customers: number }>;
}

export interface ProjectAnalytics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  
  // Financial
  total_project_value: number;
  total_billed_amount: number;
  total_cost: number;
  profitability: number;
  
  // Performance
  average_completion_time: number;
  on_time_delivery_rate: number;
  
  // Trend Data
  monthly_projects: Array<{ month: string; started: number; completed: number }>;
  project_profitability: Array<{ month: string; revenue: number; cost: number; profit: number }>;
  
  // Resource Utilization
  resource_utilization: Array<{ resource: string; allocated_hours: number; actual_hours: number; utilization: number }>;
}