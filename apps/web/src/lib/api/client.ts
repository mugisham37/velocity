import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { CSRFProtection, SecurityMiddleware } from '@/lib/security/headers';
import { validateSecurity } from '@/lib/validations/security-validators';

// Frappe API Response Types
export interface FrappeResponse<T = unknown> {
  message: T;
  exc?: string;
  exc_type?: string;
  _server_messages?: string;
}

export interface FrappeListResponse<T = unknown> {
  data: T[];
  total_count?: number;
}

export interface FrappeDocResponse<T = Record<string, unknown>> {
  data: T;
}

export interface FrappeError {
  message: string;
  exc?: string;
  exc_type?: string;
  _server_messages?: string;
}

export interface LoginCredentials {
  usr: string;
  pwd: string;
}

export interface LoginResponse {
  message: string;
  home_page: string;
  full_name: string;
  user: string;
}

export class FrappeAPIClient {
  private client: AxiosInstance;
  private sessionId?: string;
  private csrfToken?: string;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL:
        baseURL || process.env.NEXT_PUBLIC_FRAPPE_BACKEND_URL || 'http://localhost:8000',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication, security, and logging
    this.client.interceptors.request.use(
      (config) => {
        // Add session ID to headers if available
        if (this.sessionId) {
          config.headers['X-Frappe-Session-Id'] = this.sessionId;
        }

        // Add CSRF token if available
        if (this.csrfToken) {
          config.headers['X-Frappe-CSRF-Token'] = this.csrfToken;
        } else {
          // Try to get CSRF token from other sources
          const csrfToken = CSRFProtection.getToken();
          if (csrfToken) {
            config.headers['X-Frappe-CSRF-Token'] = csrfToken;
          }
        }

        // Add security headers
        const securityHeaders = SecurityMiddleware.addSecurityHeaders(config.headers || {});
        Object.assign(config.headers, securityHeaders);

        // Validate request data for security issues
        if (config.data && typeof config.data === 'object') {
          this.validateRequestData(config.data);
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        // Extract CSRF token from response headers if present
        const csrfToken = response.headers['x-frappe-csrf-token'];
        if (csrfToken) {
          this.csrfToken = csrfToken;
        }

        // Validate response security (convert AxiosResponse to Response-like object)
        const responseForValidation = {
          headers: {
            get: (name: string) => response.headers[name.toLowerCase()] || null
          }
        } as Response;
        SecurityMiddleware.validateResponse(responseForValidation);

        // Sanitize response data
        if (response.data) {
          response.data = SecurityMiddleware.sanitizeResponseData(response.data);
        }

        return response;
      },
      (error: AxiosError<FrappeError>) => {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[API Response Error]', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              method: error.config?.method,
              url: error.config?.url,
            },
          });
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.clearSession();
          // Only redirect if we're in the browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        // Validate response security (convert AxiosResponse to Response-like object)
        if (error.response) {
          const responseForValidation = {
            headers: {
              get: (name: string) => error.response?.headers[name.toLowerCase()] || null
            }
          } as Response;
          SecurityMiddleware.validateResponse(responseForValidation);
        }

        // Transform Frappe errors to user-friendly messages
        const transformedError = this.transformError(error);
        return Promise.reject(transformedError);
      }
    );
  }

  private transformError(error: AxiosError<FrappeError>): Error {
    let message = 'An unexpected error occurred';

    if (error.response?.data) {
      const frappeError = error.response.data;
      
      // Try to extract user-friendly message
      if (frappeError._server_messages) {
        try {
          const serverMessages = JSON.parse(frappeError._server_messages);
          if (Array.isArray(serverMessages) && serverMessages.length > 0) {
            const firstMessage = JSON.parse(serverMessages[0]);
            message = firstMessage.message || message;
          }
        } catch {
          // Fallback to raw server messages
          message = frappeError._server_messages;
        }
      } else if (frappeError.message) {
        message = frappeError.message;
      } else if (frappeError.exc) {
        message = frappeError.exc;
      }
    } else if (error.message) {
      message = error.message;
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      message = 'Network error. Please check your connection and try again.';
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please try again.';
    }

    const transformedError = new Error(message);
    transformedError.name = 'FrappeAPIError';
    return transformedError;
  }

  public setSession(sessionId: string) {
    this.sessionId = sessionId;
  }

  public clearSession() {
    this.sessionId = undefined;
    this.csrfToken = undefined;
  }

  public getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Validate request data for security issues
   */
  private validateRequestData(data: unknown): void {
    if (typeof data === 'string') {
      const securityCheck = validateSecurity(data);
      if (!securityCheck.isValid) {
        throw new Error(`Security validation failed: ${securityCheck.error}`);
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively validate object properties
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const securityCheck = validateSecurity(value);
          if (!securityCheck.isValid) {
            throw new Error(`Security validation failed for field '${key}': ${securityCheck.error}`);
          }
        }
      }
    }
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config
    );
    return response.data;
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.post<FrappeResponse<LoginResponse>>('/api/method/login', credentials);
    return response.message;
  }

  async logout(): Promise<void> {
    await this.post('/api/method/logout');
    this.clearSession();
  }

  async getCurrentUser(): Promise<Record<string, unknown>> {
    const response = await this.get<FrappeResponse<Record<string, unknown>>>('/api/method/frappe.auth.get_logged_user');
    return response.message;
  }

  async ping(): Promise<boolean> {
    try {
      await this.get('/api/method/ping');
      return true;
    } catch {
      return false;
    }
  }

  // Frappe-specific document methods with proper typing
  async getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
    const response = await this.get<FrappeDocResponse<T>>(`/api/resource/${doctype}/${name}`);
    return response.data;
  }

  async getList<T = Record<string, unknown>>(
    doctype: string,
    options?: {
      fields?: string[];
      filters?: Record<string, unknown> | Array<[string, string, unknown]>;
      order_by?: string;
      limit_start?: number;
      limit_page_length?: number;
      group_by?: string;
    }
  ): Promise<FrappeListResponse<T>> {
    const params = new URLSearchParams();

    if (options?.fields) {
      params.append('fields', JSON.stringify(options.fields));
    }
    if (options?.filters) {
      params.append('filters', JSON.stringify(options.filters));
    }
    if (options?.order_by) {
      params.append('order_by', options.order_by);
    }
    if (options?.limit_start !== undefined) {
      params.append('limit_start', options.limit_start.toString());
    }
    if (options?.limit_page_length !== undefined) {
      params.append('limit_page_length', options.limit_page_length.toString());
    }
    if (options?.group_by) {
      params.append('group_by', options.group_by);
    }

    const response = await this.get<FrappeListResponse<T>>(`/api/resource/${doctype}?${params.toString()}`);
    return response;
  }

  async saveDoc<T = Record<string, unknown>>(doctype: string, doc: Record<string, unknown>): Promise<T> {
    let response: FrappeDocResponse<T>;
    
    if (doc.name) {
      // Update existing document
      response = await this.put<FrappeDocResponse<T>>(`/api/resource/${doctype}/${doc.name}`, doc);
    } else {
      // Create new document
      response = await this.post<FrappeDocResponse<T>>(`/api/resource/${doctype}`, doc);
    }
    
    return response.data;
  }

  async deleteDoc(doctype: string, name: string): Promise<void> {
    await this.delete(`/api/resource/${doctype}/${name}`);
  }

  async submitDoc(doctype: string, name: string): Promise<void> {
    await this.post(`/api/resource/${doctype}/${name}`, { docstatus: 1 });
  }

  async cancelDoc(doctype: string, name: string): Promise<void> {
    await this.post(`/api/resource/${doctype}/${name}`, { docstatus: 2 });
  }

  // Generic method calling
  async call<T = unknown>(method: string, args?: Record<string, unknown>): Promise<T> {
    const response = await this.post<FrappeResponse<T>>('/api/method/' + method, args);
    return response.message;
  }

  // DocType metadata methods
  async getDocMeta(doctype: string): Promise<Record<string, unknown>> {
    return this.call('frappe.desk.form.load.get_doctype', { doctype });
  }

  async getDocInfo(doctype: string, name: string): Promise<Record<string, unknown>> {
    return this.call('frappe.desk.form.load.get_docinfo', { doctype, name });
  }

  // Search and autocomplete
  async search(doctype: string, query: string, filters?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    return this.call('frappe.desk.search.search_link', {
      doctype,
      txt: query,
      filters: filters || {},
    });
  }

  // File upload
  async uploadFile(file: File, isPrivate = false, folder = 'Home'): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_private', isPrivate ? '1' : '0');
    formData.append('folder', folder);

    const response = await this.client.post('/api/method/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.message;
  }

  // Utility methods for common operations
  async getDefaultValues(doctype: string): Promise<Record<string, unknown>> {
    return this.call('frappe.desk.form.load.get_default_values', { doctype });
  }

  async validateDoc(doctype: string, doc: Record<string, unknown>): Promise<boolean> {
    try {
      await this.call('frappe.model.document.validate_doc', { doctype, doc });
      return true;
    } catch {
      return false;
    }
  }
}

// Create a singleton instance
export const apiClient = new FrappeAPIClient();
