export interface ApiErrorItem {
  readonly level: ErrorLevel;
  readonly message: string;
  readonly details?: string;
  readonly error?: ApiErrorCode;
}

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical' | 'validation';
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiError {
  readonly status: number;
  readonly errors: ApiErrorItem[];
  readonly timestamp: string;
  readonly path: string;
}
