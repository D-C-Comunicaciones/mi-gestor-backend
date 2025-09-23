import { ResponseLoanSummaryReportDto } from "../dto";

export interface ReportLoanSummaryResponse{
    customMessage: string;
    loansSummary: ResponseLoanSummaryReportDto;
  };