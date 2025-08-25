import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ description: 'ID del cliente dueño del préstamo' })
  @IsInt()
  customerId: number;

  @ApiProperty({ description: 'Monto prestado (capital inicial)', example: 1000.0 })
  @Transform(({ value }) => (value != null ? parseFloat(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  loanAmount: number;

  @ApiPropertyOptional({ description: 'Saldo inicial (normalmente igual a capital)', example: 1000.0 })
  @Transform(({ value }) => (value != null ? parseFloat(value) : value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  remainingBalance?: number;

  @ApiProperty({ description: 'ID de la tasa de interés aplicada' })
  @IsInt()
  interestRateId: number;

  @ApiProperty({ description: 'ID de la tasa de interés moratoria (si aplica)', example: 1 })
  @IsNumber()
  @IsOptional()
  penaltyRateId?: number;

  @ApiPropertyOptional({ description: 'Cuota fija (si aplica)', example: 120.5 })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  paymentAmount?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  termId?: number;

  @ApiProperty({ description: 'ID de la frecuencia de pago' })
  @IsInt()
  paymentFrequencyId: number;

  @ApiProperty({ description: 'ID del tipo de préstamo (cuota fija vs interés mensual)' })
  @IsInt()
  loanTypeId: number;

  @ApiProperty({ description: 'ID del estado del préstamo (ACTIVO, CANCELADO, etc.)' })
  @IsInt()
  loanStatusId: number;

  @ApiPropertyOptional({ description: 'Próxima fecha de pago', example: '2025-09-19T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string | null;

  @IsNumber()
  @IsOptional()
  gracePeriod?: number;
}
