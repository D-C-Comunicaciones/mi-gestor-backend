import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLoanDto } from './create-loan.dto';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @ApiPropertyOptional({
    example: 900000,
    description: 'Saldo restante actualizado del préstamo',
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  remainingBalance?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo/inactivo del préstamo'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID del nuevo estado del préstamo (ej: 1 = Al día, 2 = Moroso, etc.)'
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  loanStatusId?: number;

  @ApiPropertyOptional({
    example: '2025-09-15',
    description: 'Nueva fecha de próximo pago en formato YYYY-MM-DD'
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional({
    example: 150000,
    description: 'Nuevo monto de la cuota periódica',
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  paymentAmount?: number;

  @ApiPropertyOptional({
    example: 24,
    description: 'Nuevo número total de cuotas (solo para préstamos de cuotas fijas)',
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  termId?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID de la nueva frecuencia de pago (ej: 1 = Diaria, 2 = Semanal, 3 = Mensual)'
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  paymentFrequencyId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID del nuevo tipo de préstamo (1 = Cuotas fijas, 2 = Interés mensual)'
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  loanTypeId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID de la nueva tasa de interés'
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  interestRateId?: number;

  @ApiPropertyOptional({
    example: '2025-08-20',
    description: 'Nueva fecha de inicio del préstamo en formato YYYY-MM-DD'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}