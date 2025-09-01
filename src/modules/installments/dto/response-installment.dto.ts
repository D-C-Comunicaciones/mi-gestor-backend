import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseInstallmentDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 228 }) @Expose() loanId: number;
  @ApiProperty({ example: 1 }) @Expose() sequence: number;

  @ApiProperty({ example: '2025-09-26' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  dueDate: string;

  @ApiProperty({ example: 0 }) @Expose() capitalAmount: number;
  @ApiProperty({ example: 1000 }) @Expose() interestAmount: number;
  @ApiProperty({ example: 1000 }) @Expose() totalAmount: number;
  @ApiProperty({ example: 0 }) @Expose() paidAmount: number;
  @ApiProperty({ example: false }) @Expose() isPaid: boolean;
  @ApiProperty({ example: true }) @Expose() isActive: boolean;
  @ApiProperty({ example: true }) @Expose() statusId: number;
  @ApiProperty({ example: true }) @Expose() statusName: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  paidAt: string | null;

  @ApiPropertyOptional({ example: '2025-08-27 13:33:14', nullable: true })
  @Expose()
  @Transform(({ value, obj }) => {
    // Primero intentar con el valor directo de la base de datos
    if (value) {
      try {
        return format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        // Si falla, continuar con los timestamps de changes
      }
    }
    
    // Si no hay value en DB, usar el timestamp de changes
    if (obj?.createdAtTimestamp) {
      try {
        return format(new Date(obj.createdAtTimestamp), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return null;
      }
    }
    
    return null;
  })
  createdAt: string | null;

  @ApiPropertyOptional({ example: '2025-08-27 13:33:14', nullable: true })
  @Expose()
  @Transform(({ value, obj }) => {
    // Primero intentar con el valor directo de la base de datos
    if (value) {
      try {
        return format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        // Si falla, continuar con los timestamps de changes
      }
    }
    
    // Si no hay value en DB, usar el timestamp de changes
    if (obj?.updatedAtTimestamp) {
      try {
        return format(new Date(obj.updatedAtTimestamp), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return null;
      }
    }
    
    return null;
  })
  updatedAt: string | null;
}