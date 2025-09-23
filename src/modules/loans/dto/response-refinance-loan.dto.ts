import { Expose, Type } from 'class-transformer';
import { ResponseLoanDto } from './response-loan.dto';

export class ResponseRefinanceLoanDto {
  @Expose()
  @Type(() => ResponseLoanDto)
  oldLoan: ResponseLoanDto;

  @Expose()
  @Type(() => ResponseLoanDto)
  newLoan: ResponseLoanDto;
}