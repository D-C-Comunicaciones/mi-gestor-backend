import { Expose, Transform, Type } from 'class-transformer';
import { format, differenceInDays } from 'date-fns';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseInstallmentDto } from '@modules/installments/dto';
import { ResponseCustomerDto } from '@modules/customers/dto';

export class ResponseLoanDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 3 }) @Expose() customerId: number;
  
  @ApiProperty({ example: 1000000 }) @Expose() loanAmount: number;
  @ApiProperty({ example: 1000000 }) @Expose() remainingBalance: number;
  @ApiProperty({ example: 1 }) @Expose() interestRateId: number;
  
  @ApiProperty({ example: 10 })
  @Expose()
  @Transform(({ obj }) => obj.interestRate?.value)
  interestRateValue: number;
  
  @ApiProperty({ example: 0 }) @Expose() paymentAmount: number;
  @ApiProperty({ example: 1 }) @Expose() termId: number | null;
  
  @ApiProperty({ example: 6 })
  @Expose()
  @Transform(({ obj }) => obj.term?.value)
  termValue: number | null;
  
  @ApiProperty({ example: 3 }) @Expose() paymentFrequencyId: number;
  
  @ApiProperty({ example: 'DIARIA' })
  @Expose()
  @Transform(({ obj }) => obj.paymentFrequency?.name)
  paymentFrequencyName: string;
  
  @ApiProperty({ example: 1 }) @Expose() loanTypeId: number;
  
  @ApiProperty({ example: 'cuotas fijas' })
  @Expose()
  @Transform(({ obj }) => obj.loanType?.name)
  loanTypeName: string;
  
  @ApiProperty({ example: 1 }) @Expose() loanStatusId: number;
  
  @ApiProperty({ example: 'Al día' })
  @Expose()
  @Transform(({ obj }) => obj.loanStatus?.name)
  loanStatusName: string;
  
  @ApiProperty({ example: '2025-05-04' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  startDate: string;
  
  @ApiPropertyOptional({ example: '2025-06-04', nullable: true })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  nextDueDate?: string;

  // 🔹 Nuevos campos para periodo de gracia
  @ApiPropertyOptional({ example: 2, nullable: true })
  @Expose() gracePeriodId?: number | null;

  @ApiPropertyOptional({ example: 3, description: 'Meses de gracia', nullable: true })
  @Expose() gracePeriodMonths?: number | null;

  @ApiPropertyOptional({ example: '2025-08-04', nullable: true })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  graceEndDate?: string | null;

  // 🔹 Campo calculado dinámicamente
  @ApiPropertyOptional({ example: 15, description: 'Días restantes de gracia', nullable: true })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.graceEndDate) return null;
    const today = new Date();
    const endDate = new Date(obj.graceEndDate);
    const daysLeft = differenceInDays(endDate, today);
    return daysLeft >= 0 ? daysLeft : 0; // si ya venció, devolvemos 0
  })
  graceDaysLeft?: number | null;
  
  @ApiProperty({ example: true }) @Expose() isActive: boolean;
  
  @ApiProperty({ example: '2025-05-04 10:00:00' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : null)
  createdAt: string;
  
  @ApiProperty({ example: '2025-05-04 10:00:00' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : null)
  updatedAt: string;
    
  // @ApiPropertyOptional({ isArray: true, type: () => ResponseInstallmentDto })
  // @Expose()
  // @Type(() => ResponseInstallmentDto)
  // installments?: ResponseInstallmentDto[];
}
