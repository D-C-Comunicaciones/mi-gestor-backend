export * from './loan-response.interface';
export * from './refinance-loan-response.interface';

export interface OverdueLoansResponse {
  customMessage: string;
  overdueLoans: any[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}