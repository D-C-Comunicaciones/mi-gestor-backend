import { OverdueLoan } from './overdue-loan.interface';

export * from './loan-response.interface';
export * from './refinance-loan-response.interface';
export * from './overdue-loan.interface';
export * from './installment-with-moratory.interface';

export interface OverdueLoansResponse {
  customMessage: string;
  overdueLoans: OverdueLoan[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}