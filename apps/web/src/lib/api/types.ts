// Additional API-related types for ERPNext

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  start?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'not like' | 'in' | 'not in' | 'is' | 'is not';
  value: unknown;
}

export interface ListOptions extends PaginationOptions {
  fields?: string[];
  filters?: FilterOptions[] | Record<string, unknown>;
  sort?: SortOptions[];
  groupBy?: string;
}

// Common ERPNext document statuses
export enum DocStatus {
  Draft = 0,
  Submitted = 1,
  Cancelled = 2,
}

// Common ERPNext field types
export enum FieldType {
  Data = 'Data',
  Text = 'Text',
  Select = 'Select',
  Link = 'Link',
  Date = 'Date',
  Datetime = 'Datetime',
  Time = 'Time',
  Check = 'Check',
  Currency = 'Currency',
  Float = 'Float',
  Int = 'Int',
  Percent = 'Percent',
  Table = 'Table',
  Attach = 'Attach',
  AttachImage = 'Attach Image',
  Color = 'Color',
  Rating = 'Rating',
  Signature = 'Signature',
  TextEditor = 'Text Editor',
  Code = 'Code',
  HTMLEditor = 'HTML Editor',
  Markdown = 'Markdown Editor',
  Password = 'Password',
  ReadOnly = 'Read Only',
  Button = 'Button',
  Geolocation = 'Geolocation',
  Duration = 'Duration',
  Barcode = 'Barcode',
  Icon = 'Icon',
}

// Session management types
export interface SessionInfo {
  user: string;
  sessionId: string;
  csrfToken?: string;
  expiresAt?: Date;
}

export interface UserSession {
  user: string;
  full_name: string;
  email: string;
  roles: string[];
  defaults: Record<string, unknown>;
  system_user: boolean;
  user_image?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  doctype?: string;
  docname?: string;
  data?: unknown;
  user?: string;
  timestamp?: string;
}

// File upload types
export interface FileUploadResponse {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: boolean;
  content_hash?: string;
}

export interface FileUploadOptions {
  isPrivate?: boolean;
  folder?: string;
  fileName?: string;
  optimize?: boolean;
}

// Report types
export interface ReportColumn {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  options?: string;
}

export interface ReportData {
  columns: ReportColumn[];
  data: unknown[][];
  total_row?: unknown[];
  chart?: {
    type: string;
    data: unknown;
  };
}

// Dashboard types
export interface DashboardChart {
  name: string;
  chart_name: string;
  chart_type: string;
  doctype: string;
  filters_json?: string;
  time_interval?: string;
  timeseries?: boolean;
  based_on?: string;
  value_based_on?: string;
  number_of_groups?: number;
}

export interface NumberCard {
  name: string;
  label: string;
  function: string;
  doctype: string;
  filters_json?: string;
  aggregate_function_based_on?: string;
}