// CRM-related type definitions

export interface Customer {
  name?: string;
  customer_name: string;
  customer_type: string;
  mobile_no?: string;
  email_id?: string;
  territory?: string;
  customer_group?: string;
  phone_no?: string;
  website?: string;
  customer_primary_address?: string;
  primary_address?: string;
  customer_primary_contact?: string;
  default_currency?: string;
  default_price_list?: string;
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  so_required?: boolean;
  dn_required?: boolean;
  is_internal_customer?: boolean;
  represents_company?: string;
  market_segment?: string;
  industry?: string;
  annual_revenue?: number;
  disabled?: boolean;
}

export interface Lead {
  name?: string;
  lead_name: string;
  organization_lead?: boolean;
  company_name?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  status: 'Lead' | 'Open' | 'Replied' | 'Opportunity' | 'Quotation' | 'Lost Quotation' | 'Interested' | 'Converted' | 'Do Not Contact';
  source: string;
  lead_type?: string;
  lead_owner?: string;
  territory?: string;
  industry?: string;
  market_segment?: string;
  qualification_status?: string;
  annual_revenue?: number;
  no_of_employees?: number;
  request_type?: string;
  notes?: string;
  creation?: string;
  modified?: string;
}

export interface LeadFormData {
  lead_name?: string;
  organization_lead?: boolean;
  company_name?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  status?: 'Lead' | 'Open' | 'Replied' | 'Opportunity' | 'Quotation' | 'Lost Quotation' | 'Interested' | 'Converted' | 'Do Not Contact';
  source?: string;
  lead_type?: string;
  lead_owner?: string;
  territory?: string;
  industry?: string;
  market_segment?: string;
  qualification_status?: string;
  annual_revenue?: number;
  no_of_employees?: number;
  request_type?: string;
  notes?: string;
}

export interface LeadListResponse {
  data: Lead[];
  total_count: number;
}

export interface Opportunity {
  name?: string;
  opportunity_from: 'Lead' | 'Customer';
  party_name: string;
  customer_name?: string;
  opportunity_type: string;
  source?: string;
  status: 'Open' | 'Quotation' | 'Reply' | 'Closed' | 'Lost' | 'Converted';
  sales_stage?: string;
  probability?: number;
  opportunity_amount?: number;
  currency?: string;
  expected_closing?: string;
  with_items?: boolean;
  items?: OpportunityItem[];
  territory?: string;
  campaign?: string;
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  notes?: string;
  next_contact_date?: string;
  next_contact_by?: string;
  creation?: string;
  modified?: string;
}

export interface OpportunityItem {
  item_code: string;
  item_name?: string;
  description?: string;
  qty: number;
  uom?: string;
  rate?: number;
  amount?: number;
}

export interface OpportunityFormData {
  opportunity_from?: 'Lead' | 'Customer';
  party_name?: string;
  customer_name?: string;
  opportunity_type?: string;
  source?: string;
  status?: 'Open' | 'Quotation' | 'Reply' | 'Closed' | 'Lost' | 'Converted';
  sales_stage?: string;
  probability?: number;
  opportunity_amount?: number;
  currency?: string;
  expected_closing?: string;
  with_items?: boolean;
  items?: OpportunityItem[];
  territory?: string;
  campaign?: string;
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  notes?: string;
  next_contact_date?: string;
  next_contact_by?: string;
}

export interface OpportunityListResponse {
  data: Opportunity[];
  total_count: number;
}

export interface Contact {
  name?: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  designation?: string;
  department?: string;
  company_name?: string;
  status: 'Passive' | 'Open' | 'Replied';
  is_primary_contact?: boolean;
  unsubscribed?: boolean;
  links?: ContactLink[];
  address?: string;
  creation?: string;
  modified?: string;
}

export interface ContactLink {
  link_doctype: string;
  link_name: string;
  link_title?: string;
}

export interface ContactFormData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  designation?: string;
  department?: string;
  company_name?: string;
  status?: 'Passive' | 'Open' | 'Replied';
  is_primary_contact?: boolean;
  unsubscribed?: boolean;
  links?: ContactLink[];
  address?: string;
}

export interface ContactListResponse {
  data: Contact[];
  total_count: number;
}

export interface CustomerFormData {
  customer_name?: string;
  customer_type?: string;
  mobile_no?: string;
  email_id?: string;
  territory?: string;
  customer_group?: string;
  phone_no?: string;
  website?: string;
  customer_primary_address?: string;
  primary_address?: string;
  customer_primary_contact?: string;
  default_currency?: string;
  default_price_list?: string;
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  so_required?: boolean;
  dn_required?: boolean;
  is_internal_customer?: boolean;
  represents_company?: string;
  market_segment?: string;
  industry?: string;
  annual_revenue?: number;
  disabled?: boolean;
}

export interface CustomerListResponse {
  data: Customer[];
  total_count: number;
}

export interface Project {
  name?: string;
  project_name: string;
  status: 'Open' | 'Completed' | 'Cancelled';
  project_type?: string;
  customer?: string;
  customer_name?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  priority: 'Low' | 'Medium' | 'High';
  percent_complete?: number;
  estimated_costing?: number;
  actual_costing?: number;
  gross_margin?: number;
  department?: string;
  notes?: string;
  creation?: string;
  modified?: string;
}

export interface ProjectFormData {
  project_name?: string;
  status?: 'Open' | 'Completed' | 'Cancelled';
  project_type?: string;
  customer?: string;
  customer_name?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  priority?: 'Low' | 'Medium' | 'High';
  percent_complete?: number;
  estimated_costing?: number;
  actual_costing?: number;
  gross_margin?: number;
  department?: string;
  notes?: string;
}

export interface ProjectListResponse {
  data: Project[];
  total_count: number;
}

export interface Task {
  name?: string;
  subject: string;
  status: 'Open' | 'Working' | 'Pending Review' | 'Overdue' | 'Template' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  task_weight?: number;
  description?: string;
  project?: string;
  assigned_to?: string;
  assigned_by?: string;
  exp_start_date?: string;
  exp_end_date?: string;
  act_start_date?: string;
  act_end_date?: string;
  expected_time?: number;
  actual_time?: number;
  progress?: number;
  is_group?: boolean;
  is_template?: boolean;
  parent_task?: string;
  dependencies?: TaskDependency[];
  creation?: string;
  modified?: string;
}

export interface TaskDependency {
  task: string;
  subject?: string;
}

export interface TaskFormData {
  subject?: string;
  status?: 'Open' | 'Working' | 'Pending Review' | 'Overdue' | 'Template' | 'Completed' | 'Cancelled';
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  task_weight?: number;
  description?: string;
  project?: string;
  assigned_to?: string;
  assigned_by?: string;
  exp_start_date?: string;
  exp_end_date?: string;
  act_start_date?: string;
  act_end_date?: string;
  expected_time?: number;
  actual_time?: number;
  progress?: number;
  is_group?: boolean;
  is_template?: boolean;
  parent_task?: string;
  dependencies?: TaskDependency[];
}

export interface TaskListResponse {
  data: Task[];
  total_count: number;
}

export interface CRMAnalytics {
  total_leads: number;
  total_opportunities: number;
  total_customers: number;
  conversion_rate: number;
  pipeline_value: number;
  won_opportunities: number;
  lost_opportunities: number;
  average_deal_size: number;
}

export interface ProjectAnalytics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  average_project_duration: number;
}