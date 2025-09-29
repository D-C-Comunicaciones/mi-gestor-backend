import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseInstallmentDto } from '@modules/installments/dto';
import { ResponseCustomerDto } from '@modules/customers/dto';
import { format } from 'date-fns';

export class ResponseLoanDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 3 }) @Expose() customerId: number;
  
  @ApiProperty({ example: 'Juan Pérez' })
  @Expose()
  customerName: string;
  
  @ApiProperty({ example: 1000000 }) @Expose() loanAmount: number;
  @ApiProperty({ example: 1000000 }) @Expose() remainingBalance: number;
  @ApiProperty({ example: 1 }) @Expose() interestRateId: number;

  @ApiProperty({ example: 10 })
  @Expose()
  interestRateValue: number; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: 1 }) @Expose() termId: number | null;

  @ApiProperty({ example: 6 })
  @Expose()
  termValue: number | null; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: 3 }) @Expose() paymentFrequencyId: number;

  @ApiProperty({ example: 'DIARIA' })
  @Expose()
  paymentFrequencyName: string; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: 1 }) @Expose() loanTypeId: number;

  @ApiProperty({ example: 'cuotas fijas' })
  @Expose()
  loanTypeName: string; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: 1 }) @Expose() loanStatusId: number;

  @ApiProperty({ example: 'Al día' })
  @Expose()
  loanStatusName: string; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: '2025-05-04' })
  @Expose()
  startDate: string; // ← Ya viene formateado desde _mapLoan

  @ApiPropertyOptional({ example: '2025-06-04', nullable: true })
  @Expose()
  nextDueDate?: string; // ← Ya viene formateado desde _mapLoan

  @ApiPropertyOptional({ example: 2, nullable: true }) 
  @Expose() 
  gracePeriodId?: number | null;

  @ApiPropertyOptional({ example: '2025-08-04', nullable: true })
  @Expose()
  graceEndDate?: string | null; // ← Ya viene formateado desde _mapLoan

  @ApiPropertyOptional({ example: 15, nullable: true })
  @Expose()
  graceDaysLeft?: number | null; // ← Ya viene calculado desde _mapLoan

  @ApiProperty({ example: true }) @Expose() isActive: boolean;

 @ApiPropertyOptional({ example: '2025-08-27 17:12:21', nullable: true })
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      try { return format(new Date(value), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    if (obj?.createdAtTimestamp) {
      try { return format(new Date(obj.createdAtTimestamp), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    return null;
  })
  createdAt: string | null;

  @ApiPropertyOptional({ example: '2025-08-27 17:12:21', nullable: true })
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      try { return format(new Date(value), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    if (obj?.updatedAtTimestamp) {
      try { return format(new Date(obj.updatedAtTimestamp), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    return null;
  })
  updatedAt: string | null;
  @ApiProperty({ type: () => ResponseCustomerDto }) 
  @Expose() 
  @Type(() => ResponseCustomerDto) 
  customer?: ResponseCustomerDto;

  @ApiProperty({ type: () => ResponseInstallmentDto }) 
  @Expose() 
  @Type(() => ResponseInstallmentDto) 
  firstInstallment?: ResponseInstallmentDto;
}