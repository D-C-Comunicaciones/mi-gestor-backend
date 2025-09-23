import { ResponseLoanDto } from '../dto';

export interface RefinanceLoanResponse {
  customMessage: string;
  oldLoan: ResponseLoanDto;
  newLoan: ResponseLoanDto;
}