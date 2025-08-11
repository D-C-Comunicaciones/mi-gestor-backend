export interface ApiResponse<T> {
  statusCode: number;
  customMessage: string;
  data?: T;
}