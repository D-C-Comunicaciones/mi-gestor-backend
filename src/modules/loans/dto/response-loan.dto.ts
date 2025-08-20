import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const toTrimmedString = (value: any) => {
  if (value == null) return value;
  const s = value.toString();
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};

export class ResponseLoanDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 3 }) @Expose() customerId: number;

  @ApiProperty({ example: '1000.5' })
  @Expose()
  @Transform(({ obj }) => toTrimmedString(obj.loanAmount?.toString()), { toPlainOnly: true })
  loanAmount: string;

  @ApiProperty({ example: '950.25' })
  @Expose()
  @Transform(({ obj }) => toTrimmedString(obj.remainingBalance?.toString()), { toPlainOnly: true })
  remainingBalance: string;

  @ApiProperty({ example: '12.5' })
  @Expose()
  @Transform(({ obj }) => toTrimmedString(obj.interestRate?.value?.toString()), { toPlainOnly: true })
  interestRate: string;

  @ApiPropertyOptional({ example: '120.75', nullable: true })
  @Expose()
  @Transform(({ obj }) => (obj.paymentAmount == null ? null : toTrimmedString(obj.paymentAmount.toString())), { toPlainOnly: true })
  paymentAmount?: string | null;

  @ApiPropertyOptional({ example: 12, nullable: true }) @Expose() term?: number | null;

  @ApiProperty({ example: 2 }) @Expose() paymentFrequencyId: number;
  @ApiProperty({ example: 1 }) @Expose() loanTypeId: number;
  @ApiProperty({ example: 1 }) @Expose() loanStatusId: number;

  @ApiProperty({ example: '2025-01-10' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd') : value), { toPlainOnly: true })
  startDate: Date;

  @ApiPropertyOptional({ example: '2025-02-10', nullable: true })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd') : value), { toPlainOnly: true })
  nextDueDate?: Date | null;

  @ApiProperty({ example: true }) @Expose() isActive: boolean;

  @ApiProperty({ example: '2025-01-01 10:00:00' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-05 11:15:30' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true }) @Expose() customer?: any;
  @ApiPropertyOptional({ nullable: true }) @Expose() paymentFrequency?: any;
  @ApiPropertyOptional({ nullable: true }) @Expose() loanType?: any;
  @ApiPropertyOptional({ nullable: true }) @Expose() loanStatus?: any;
  @ApiPropertyOptional({ isArray: true, nullable: true }) @Expose() installments?: any[];
  @ApiPropertyOptional({ isArray: true, nullable: true }) @Expose() payments?: any[];
}
