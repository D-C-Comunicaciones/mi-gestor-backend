import { PaginationDto } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DiscountPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ example: true, description: 'Filtrar por descuentos activos/inactivos' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    return value === true;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de cuota' })
  @IsOptional()
  installmentId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filtrar por ID de préstamo' })
  @IsOptional()
  loanId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de interes moratorio' })
  @IsOptional()
  moratoryId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de descuento',
    example: 'PERCENTAGE',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    required: false
  })
  @IsOptional()
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'], { 
    message: 'El tipo debe ser: PERCENTAGE o FIXED_AMOUNT' 
  })
  @Transform(({ value }) => value?.toUpperCase())
  discountType?: string;

  @ApiPropertyOptional({
    description: 'Buscar por nombre del descuento',
    example: 'pago anticipado',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar descuentos vigentes en una fecha específica (formato YYYY-MM-DD)',
    example: '2025-06-15',
    type: 'string',
    format: 'date',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  validOn?: string;

  @ApiPropertyOptional({
    description: 'Valor mínimo del descuento para filtrar',
    example: 5.0,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El valor mínimo debe ser un número' })
  @Min(0, { message: 'El valor mínimo debe ser mayor o igual a cero' })
  minValue?: number;

  @ApiPropertyOptional({
    description: 'Valor máximo del descuento para filtrar',
    example: 50.0,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El valor máximo debe ser un número' })
  @Min(0, { message: 'El valor máximo debe ser mayor o igual a cero' })
  maxValue?: number;
}
