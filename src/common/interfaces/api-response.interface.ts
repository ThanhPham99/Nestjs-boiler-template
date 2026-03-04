export interface ApiResponse<T> {
  error_code: string;
  message?: string;
  data?: T | null;
  errors?: unknown;
  timestamp: string;
  path: string;
}
