import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { format } from 'date-fns';

class LoanInfoDto {
  @ApiProperty({ example: 'Overdue' })
  @Expose()
  status: string;

  @ApiProperty({ example: 'fixed_fees' })
  @Expose()
  type: string;

  @ApiProperty({ example: '2025-05-04' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  startDate: string | null;

  @ApiProperty({ example: null })
  @Expose()
  gracePeriod: number | null;

  @ApiProperty({ example: 2 })
  @Expose()
  termValue: number | null;

  @ApiProperty({ example: 'Minute' })
  @Expose()
  paymentFrequency: string;

  @ApiProperty({ example: '1/2' })
  @Expose()
  paidInstallments: string;

  @ApiProperty({ example: 1 })
  @Expose()
  overdueInstallments: number;

  @ApiProperty({ example: 1 })
  @Expose()
  pendingInstallments: number;
}

class LoanSummaryDto {
  @ApiProperty({ example: 1000000 })
  @Expose()
  remainingBalance: number;

  @ApiProperty({ example: 166.66 })
  @Expose()
  totalLateFees: number;

  @ApiProperty({ example: 3 })
  @Expose()
  totalDaysLate: number;
}

class ResponseInstallmentDto {
  @ApiProperty({ example: 1 })
  @Expose()
  installmentId: number;

  @ApiProperty({ example: 1 })
  @Expose()
  sequence: number;

  @ApiProperty({ example: '2025-05-15' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  dueDate: string | null;

  @ApiProperty({ example: 'Pending' })
  @Expose()
  status: string;

  @ApiProperty({ example: 497512.44 })
  @Expose()
  capitalAmount: number;

  @ApiProperty({ example: 10000 })
  @Expose()
  interestAmount: number;

  @ApiProperty({ example: 507512.44 })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: 0 })
  @Expose()
  paidAmount: number;

  @ApiProperty({ example: 16.66 })
  @Expose()
  lateFee: number;

  @ApiProperty({ example: 1 })
  @Expose()
  daysLate: number;

  @ApiProperty({ example: 507529.10 })
  @Expose()
  totalToPay: number;
}

export class ResponseLoanWithInstallmentsDto {
  @ApiProperty({ example: 1 })
  @Expose()
  loanId: number;

  @ApiProperty({ example: { name: 'Juan Pérez' } })
  @Expose()
  customer: { name: string };

  @ApiProperty({ type: () => LoanInfoDto })
  @Expose()
  @Type(() => LoanInfoDto)
  loanInfo: LoanInfoDto;

  @ApiProperty({ type: () => LoanSummaryDto })
  @Expose()
  @Type(() => LoanSummaryDto)
  summary: LoanSummaryDto;

  @ApiProperty({ type: [ResponseInstallmentDto] })
  @Expose()
  @Type(() => ResponseInstallmentDto)
  installments: ResponseInstallmentDto[];
}
