export * from './collection-report-data.interface';
export * from './loan-report-data.interface';

export interface LoansReportData {
  headerLogo: string;
  watermarkLogo?: string;
  verticalTextBase64?: string;
  reportDate: string;
  startDate: string;
  endDate: string;
  
  summary: {
    numberOfNewLoans: number;
    newLoansTotalAmount: number;
    numberOfRefinancedLoans: number;
    refinancedLoansTotalAmount: number;
    totalLoans: number;
    totalAmount: number;
    averageLoanAmount: number;
  };
  
  newLoansDetails: Array<{
    id: number;
    loanAmount: number;
    remainingBalance: number;
    startDate: string;
    interestRateValue: number;
    penaltyRateValue: number | null;
    creditTypeName: string;
    customerName: string;
    customerDocument: string;
    customerAddress: string;
    customerPhone: string;
    loanStatusName: string;
  }>;
  
  refinancedLoansDetails: Array<{
    id: number;
    loanAmount: number;
    remainingBalance: number;
    startDate: string;
    interestRateValue: number;
    penaltyRateValue: number | null;
    creditTypeName: string;
    customerName: string;
    customerDocument: string;
    customerAddress: string;
    customerPhone: string;
    loanStatusName: string;
  }>;
  
  newLoansChartBase64?: string;
  comparisonChartBase64?: string;
}