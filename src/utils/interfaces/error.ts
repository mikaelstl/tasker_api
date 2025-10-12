interface Error {
  level: ErrorLevel;
  message: string
}

type ErrorLevel =  'info' | 'warning' | 'error' | 'critical' | 'validation';

export interface ApiError {
  readonly status: number,
  readonly errors: Error[],
  readonly timestamp: string,
  readonly path: string
}