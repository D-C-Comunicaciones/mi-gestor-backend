import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseInstallmentDto {
  @ApiProperty({ example: 1 }) @Expose() sequence: number;
  
  @ApiProperty({ example: '2025-09-19' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  dueDate: Date;
  
  @ApiProperty({ example: 166666.67 }) @Expose() capitalAmount: number;
  @ApiProperty({ example: 100000 }) @Expose() interestAmount: number;
  @ApiProperty({ example: 266666.67 }) @Expose() totalAmount: number;
  @ApiProperty({ example: 0 }) @Expose() paidAmount: number;
  @ApiProperty({ example: false }) @Expose() isPaid: boolean;
  @ApiProperty({ example: true }) @Expose() isActive: boolean;
  
  @ApiProperty({ example: null, nullable: true })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  paidAt: Date | null;
}