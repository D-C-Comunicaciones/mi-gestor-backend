import { ResponseLoanReportDto } from "../dto/response-loan-report.dto";

export interface LoanReportResponse{
    customMessage: string;
    loansReport: ResponseLoanReportDto;
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