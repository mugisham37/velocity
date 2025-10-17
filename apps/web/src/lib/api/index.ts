// Main API exports for ERPNext frontend

export { FrappeAPIClient, apiClient } from './client';
export type {
  FrappeResponse,
  FrappeListResponse,
  FrappeDocResponse,
  FrappeError,
  LoginCredentials,
  LoginResponse,
} from './client';

export type {
  ApiError,
  RequestOptions,
  PaginationOptions,
  SortOptions,
  FilterOptions,
  ListOptions,
  DocStatus,
  FieldType,
  SessionInfo,
  UserSession,
  WebSocketMessage,
  FileUploadResponse,
  FileUploadOptions,
  ReportColumn,
  ReportData,
  DashboardChart,
  NumberCard,
} from './types';

export {
  convertFiltersToFrappeFormat,
  buildListParams,
  createApiError,
  isApiError,
  extractErrorMessage,
  isValidDocName,
  formatDocName,
  generateRequestId,
  debounce,
  retry,
  formatFileSize,
  isValidFileType,
  parseFrappeDateTime,
  formatFrappeDateTime,
  parseFrappeDate,
  formatFrappeDate,
  sanitizeHtml,
} from './utils';