import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * DTO para la creación de un nuevo descuento
 * Define los campos requeridos para aplicar un descuento a cuotas o intereses moratorios
 * Permite descuentos por porcentaje o monto fijo según el tipo configurado
 */
export class CreateDiscountDto {

  @ApiProperty({
    description: 'ID de la cuota a la que se aplica el descuento',
    example: 1,
    type: 'integer',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  installmentId?: number;

  @ApiProperty({
    description: 'ID del interés moratorio al que se aplica el descuento',
    example: 2,
    type: 'integer',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  moratoryId?: number;

  @ApiProperty({
    description: 'ID del tipo de descuento (1 para porcentaje, 2 para monto fijo)',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  discountTypeId: number;

  @ApiProperty({
    description: 'Monto del descuento (requerido si el tipo es monto fijo)',
    example: 10000,
    type: 'number',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount?: number;

  @ApiProperty({
    description: 'Porcentaje del descuento (requerido si el tipo es porcentaje)',
    example: 10,
    type: 'number',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  percentageId?: number;

  @ApiProperty({
    description: 'Nombre descriptivo del descuento',
    example: 'Descuento por pronto pago',
    type: 'string',
    maxLength: 200
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
