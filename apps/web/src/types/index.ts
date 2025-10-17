// Core ERPNext Types

export interface DocTypeSchema {
  name: string;
  module: string;
  fields: DocField[];
  permissions: Permission[];
  links: DocTypeLink[];
  actions: CustomAction[];
  listSettings: ListSettings;
  formSettings: FormSettings;
}

export interface DocField {
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  options?: string;
  reqd?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  depends_on?: string;
  default?: string | number | boolean;
  validation?: ValidationRule[];
}

export type FieldType =
  | 'Data'
  | 'Text'
  | 'Select'
  | 'Link'
  | 'Date'
  | 'Datetime'
  | 'Time'
  | 'Check'
  | 'Currency'
  | 'Float'
  | 'Int'
  | 'Percent'
  | 'Table'
  | 'Attach'
  | 'Color'
  | 'Rating'
  | 'Signature'
  | 'Text Editor';

export interface Permission {
  role: string;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  amend: boolean;
}

export interface DocTypeLink {
  link_doctype: string;
  link_fieldname: string;
}

export interface CustomAction {
  label: string;
  action: string;
  condition?: string;
}

export interface ListSettings {
  columns: string[];
  filters: FilterCondition[];
  sort: SortCondition[];
}

export interface FormSettings {
  layout: FormLayout;
  sections: FormSection[];
}

export interface FormLayout {
  columns: number;
  sections: string[];
}

export interface FormSection {
  label: string;
  fields: string[];
  collapsible?: boolean;
}

export interface ValidationRule {
  type: string;
  value: string | number | boolean;
  message: string;
}

export interface FilterCondition {
  fieldname: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'like'
  | 'not like'
  | 'in'
  | 'not in'
  | 'is'
  | 'is not';

export interface SortCondition {
  fieldname: string;
  direction: 'asc' | 'desc';
}

export interface DocumentState {
  doctype: string;
  name: string;
  data: Record<string, unknown>;
  meta: DocTypeSchema;
  isDirty: boolean;
  isSubmitted: boolean;
  permissions: DocumentPermissions;
  timeline: TimelineEntry[];
  attachments: Attachment[];
}

export interface DocumentPermissions {
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  amend: boolean;
}

export interface TimelineEntry {
  creation: string;
  owner: string;
  content: string;
  communication_type: string;
}

export interface Attachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: boolean;
}

export interface ListViewState {
  doctype: string;
  data: DocumentListItem[];
  filters: FilterCondition[];
  sort: SortCondition[];
  pagination: PaginationState;
  selection: string[];
  groupBy?: string;
  totalCount: number;
  isLoading: boolean;
}

export interface DocumentListItem {
  name: string;
  [key: string]: unknown;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  name: string;
  email: string;
  full_name: string;
  roles: string[];
  user_image?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionId?: string;
}

// Re-export module-specific types with explicit exports to avoid conflicts
export * from './accounts';
export * from './pos';
export * from './stock';
export * from './manufacturing';

// Export CRM types
export type {
  Lead,
  LeadFormData,
  LeadListResponse,
  Opportunity,
  OpportunityFormData,
  OpportunityListResponse,
  OpportunityItem,
  Customer as CRMCustomer,
  CustomerFormData as CRMCustomerFormData,
  CustomerListResponse as CRMCustomerListResponse,
  Contact,
  ContactFormData,
  ContactListResponse,
  ContactLink,
  Project,
  ProjectFormData,
  ProjectListResponse,
  Task,
  TaskFormData,
  TaskListResponse,
  TaskDependency,
  CRMAnalytics,
  ProjectAnalytics
} from './crm';

// Export Sales types
export type {
  Customer as SalesCustomer,
  SalesOrder,
  SalesOrderItem,
  SalesOrderTax,
  SalesOrderFormData,
  SalesCustomerFormData,
  SalesOrderListResponse,
  SalesCustomerListResponse,
  PricingRule,
  SalesInvoice,
  SalesInvoiceItem,
  DeliveryNote,
  DeliveryNoteItem,
  SalesAnalytics,
  SalesFunnel,
  PaymentSchedule as SalesPaymentSchedule
} from './sales';

// Export Buying types
export type {
  Supplier,
  SupplierFormData,
  SupplierListResponse,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderTax,
  PurchaseOrderFormData,
  PurchaseOrderListResponse,
  SupplierQuotation,
  SupplierQuotationItem,
  SupplierQuotationListResponse,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseReceipt,
  PurchaseReceiptItem,
  RequestForQuotation,
  RFQSupplier,
  RFQItem,
  PurchaseAnalytics,
  SupplierPerformance,
  PaymentSchedule as BuyingPaymentSchedule
} from './buying';

// Export Dashboard types
export type {
  DashboardConfig,
  DashboardType,
  DashboardLayout,
  DashboardPermissions,
  WidgetConfig,
  WidgetType,
  WidgetPosition,
  WidgetSize,
  WidgetPermissions,
  ChartWidgetConfig,
  ChartType,
  ChartDataSource,
  DateRange,
  AggregateFunction as DashboardAggregateFunction,
  ChartStyling,
  ChartInteractions,
  NumberCardConfig,
  NumberCardDataSource,
  NumberCardDisplay,
  NumberCardTrend,
  ShortcutWidgetConfig,
  ShortcutItem,
  ShortcutAction,
  ShortcutLayout,
  ReportWidgetConfig,
  CustomWidgetConfig,
  WidgetSpecificConfig,
  WidgetData,
  ChartData as DashboardChartData,
  ChartDataset,
  NumberCardData,
  DashboardState,
  DashboardActions
} from './dashboard';

// Export Reports types
export type {
  ReportField,
  ReportFilter,
  FilterOperator as ReportsFilterOperator,
  ReportGroupBy,
  ReportColumn,
  ReportQuery,
  ReportDefinition,
  ReportType as ReportsReportType,
  SummaryConfig,
  AggregateFunction as ReportsAggregateFunction,
  ScriptConfig,
  FormattingOptions,
  ChartConfig,
  ReportResult,
  ChartData as ReportsChartData,
  DocTypeRelation,
  ReportBuilderState,
  ReportSchedule,
  ExportOptions
} from './reports';
