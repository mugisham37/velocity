// Report Builder Types
export interface ReportField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  doctype: string;
  parent?: string;
  is_virtual?: boolean;
}

export interface ReportFilter {
  fieldname: string;
  operator: FilterOperator;
  value: unknown;
  condition?: 'AND' | 'OR';
}

export type FilterOperator = 
  | '=' | '!=' | '>' | '<' | '>=' | '<=' 
  | 'like' | 'not like' | 'in' | 'not in' 
  | 'is' | 'is not' | 'between' | 'timespan';

export interface ReportGroupBy {
  fieldname: string;
  label: string;
  sort_order?: 'asc' | 'desc';
}

export interface ReportColumn {
  fieldname: string;
  label: string;
  width?: number;
  format?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

export interface ReportQuery {
  doctype: string;
  fields: ReportField[];
  filters: ReportFilter[];
  group_by?: ReportGroupBy[];
  order_by?: { fieldname: string; order: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface ReportDefinition {
  name: string;
  title: string;
  description?: string;
  doctype: string;
  report_type: ReportType;
  query: ReportQuery;
  columns: ReportColumn[];
  chart_config?: ChartConfig;
  summary_config?: SummaryConfig;
  script_config?: ScriptConfig;
  formatting_options?: FormattingOptions;
  is_standard?: boolean;
  owner?: string;
  creation?: string;
  modified?: string;
}

export type ReportType = 'tabular' | 'summary' | 'chart' | 'script';

export interface SummaryConfig {
  group_by_fields: string[];
  aggregate_functions: AggregateFunction[];
  show_totals: boolean;
  show_percentages: boolean;
}

export interface AggregateFunction {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  label?: string;
}

export interface ScriptConfig {
  script_name: string;
  parameters?: Record<string, unknown>;
}

export interface FormattingOptions {
  show_row_numbers: boolean;
  alternate_row_colors: boolean;
  freeze_first_column: boolean;
  page_size: number;
  currency_symbol?: string;
  date_format?: string;
  number_format?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  x_field: string;
  y_fields: string[];
  color?: string;
  height?: number;
}

export interface ReportResult {
  columns: ReportColumn[];
  data: unknown[][];
  total_row?: unknown[];
  chart_data?: ChartData;
  message?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface DocTypeRelation {
  parent: string;
  child: string;
  fieldname: string;
  label: string;
  type: 'Link' | 'Table' | 'Child Table';
}

export interface ReportBuilderState {
  selectedDocType: string;
  availableFields: ReportField[];
  selectedFields: ReportField[];
  filters: ReportFilter[];
  groupBy: ReportGroupBy[];
  orderBy: { fieldname: string; order: 'asc' | 'desc' }[];
  relations: DocTypeRelation[];
  previewData?: ReportResult;
  isLoading: boolean;
}

// Report Scheduling Types
export interface ReportSchedule {
  name: string;
  report_name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  day_of_week?: number;
  day_of_month?: number;
  time: string;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV';
  filters?: ReportFilter[];
  enabled: boolean;
  next_run?: string;
  last_run?: string;
}

// Export Types
export interface ExportOptions {
  format: 'PDF' | 'Excel' | 'CSV';
  filename?: string;
  include_filters?: boolean;
  page_size?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}