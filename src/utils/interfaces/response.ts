export interface ApiResponse {
  readonly status: number;
  
  readonly message: string;
  
  readonly data: any;
  
  readonly path: string;
  
  readonly error: boolean;

  readonly timestamp: string;
}