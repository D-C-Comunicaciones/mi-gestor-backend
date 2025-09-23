import { IsOptional, IsNumber, IsString, Min, IsEnum, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para paginación y filtros de recaudos
 * Permite filtrar recaudos por diferentes criterios como cobrador, zona, fechas, etc.
 * Utilizado en reportes de cobranza y consultas históricas
 */
export class CollectionPaginationDto {
  @ApiProperty({
    description: 'Número de página para la paginación',
    example: 1,
    type: 'integer',
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar por ID del cobrador específico',
    example: 3,
    type: 'integer',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del cobrador debe ser un número' })
  collectorId?: number;

  @ApiProperty({
    description: 'Filtrar por zona o ruta de cobranza',
    example: 'Norte',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La zona debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  zone?: string;

  @ApiProperty({
    description: 'Fecha de inicio del rango de búsqueda (formato YYYY-MM-DD)',
    example: '2025-01-01',
    type: 'string',
    format: 'date',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin del rango de búsqueda (formato YYYY-MM-DD)',
    example: '2025-01-31',
    type: 'string',
    format: 'date',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  endDate?: string;

  @ApiProperty({
    description: 'Filtrar por estado del recaudo',
    example: 'confirmed',
    type: 'string',
    enum: ['confirmed', 'pending', 'cancelled'],
    required: false
  })
  @IsOptional()
  @IsEnum(['confirmed', 'pending', 'cancelled'], { 
    message: 'El estado debe ser: confirmed, pending o cancelled' 
  })
  @Transform(({ value }) => value?.toLowerCase())
  status?: string;

  @ApiProperty({
    description: 'Monto mínimo del recaudo para filtrar',
    example: 50000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
  @Min(0, { message: 'El monto mínimo debe ser mayor o igual a cero' })
  minAmount?: number;

  @ApiProperty({
    description: 'Monto máximo del recaudo para filtrar',
    example: 500000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto máximo debe ser un número' })
  @Min(0, { message: 'El monto máximo debe ser mayor o igual a cero' })
  maxAmount?: number;

  @ApiProperty({
    description: 'Filtrar por método de pago utilizado',
    example: 'cash',
    type: 'string',
    enum: ['cash', 'transfer', 'check', 'other'],
    required: false
  })
  @IsOptional()
  @IsEnum(['cash', 'transfer', 'check', 'other'], { 
    message: 'El método de pago debe ser: cash, transfer, check u other' 
  })
  @Transform(({ value }) => value?.toLowerCase())
  paymentMethod?: string;

  @ApiProperty({
    description: 'Buscar por número de documento del cliente',
    example: '12345678',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El documento del cliente debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  customerDocument?: string;
}
