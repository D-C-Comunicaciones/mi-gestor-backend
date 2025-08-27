import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsDecimal, IsInt, IsNumber, IsOptional, IsPositive, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ description: 'ID del cliente dueño del préstamo' })
  @IsInt()
  customerId: number;

  @ApiProperty({ description: 'Monto prestado (capital inicial)', example: 1000.0 })
  @Transform(({ value }) => (value != null ? parseFloat(value) : value))
  @IsNumber({maxDecimalPlaces: 2})
  @Min(0, { message: 'loanAmount must be greater than or equal to 0' })
  @IsPositive()
  loanAmount: number;

  @ApiProperty({ description: 'ID de la tasa de interés aplicada' })
  @IsInt()
  interestRateId: number;

  @ApiProperty({ description: 'ID de la tasa de interés moratoria (si aplica)', example: 1 })
  @IsNumber()
  @IsOptional()
  penaltyRateId?: number;

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
  gracePeriodId?: number;
}
