import { ResponseLoanReportDto } from "../dto";

export interface LoanReportResponse{
    customMessage: string;
    loansReport: ResponseLoanReportDto;
  };
