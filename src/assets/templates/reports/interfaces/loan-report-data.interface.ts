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
  refinancedLoansChartBase64?: string;
  comparisonChartBase64?: string;

  // 🔹 Nuevas propiedades para gráficas de estado
  statusBarChartBase64?: string;
  statusComparisonChartBase64?: string;
}
