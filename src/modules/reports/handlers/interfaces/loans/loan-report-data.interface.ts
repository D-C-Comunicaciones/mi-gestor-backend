import { LoanDetail } from "./loan-detail.interface";
import { LoansReportMetadata } from "./loan-report-metadata.interface";
import { LoansReportSummary } from "./loan-report-summary.interface";

export interface LoanReportData {
  startDate: string;
  endDate: string;
  numberOfNewLoans: number;
  newLoansTotalAmount: number;
  newLoansDetails: LoanDetail[];
  numberOfRefinancedLoans: number;
  refinancedLoansTotalAmount: number;
  refinancedLoansDetails: LoanDetail[];
  summary: LoansReportSummary;
  metadata: LoansReportMetadata;
}