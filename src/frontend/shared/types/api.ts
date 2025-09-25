export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
  status: number;
}

export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Record<string, any>;
  body?: Record<string, any>;
  response: Record<string, any>;
}

export interface ApiConfig {
  base_url: string;
  timeout: number;
  retry_attempts: number;
  retry_delay: number;
  headers: Record<string, string>;
}
