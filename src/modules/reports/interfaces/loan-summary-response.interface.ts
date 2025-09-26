import { ResponseLoanSummaryReportDto } from "../dto";

export interface ReportLoanSummaryResponse{
    customMessage: string;
    loansSummary: ResponseLoanSummaryReportDto;
  };

  export interface NewLoanInterestDetail {
  id: number;
  loanAmount: number;
  customerName: string;
  startDate: string;
  totalInterest: number;
}

export interface NewLoansInterestReportResponse {
  totalNewLoans: number;
  totalNewLoansInterestAmount: number;
  details: NewLoanInterestDetail[];
}