import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsPositive, Min } from 'class-validator';

/**
 * DTO para la creación de un descuento.
 * Solo aplicable a moratorias.
 */
export class CreateDiscountDto {
  @ApiProperty({
    description: 'Monto del descuento en pesos colombianos',
    example: 88100,
    type: 'number',
    minimum: 0
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsNotEmpty({ message: 'El monto es requerido' })
  @IsPositive({ message: 'El monto debe ser un número positivo' })
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  amount: number;

  @ApiProperty({
    description: 'ID del tipo de descuento',
    example: 1,
    type: 'number'
  })
  @IsNumber({}, { message: 'El ID del tipo de descuento debe ser un número' })
  @IsNotEmpty({ message: 'El ID del tipo de descuento es requerido' })
  @IsPositive({ message: 'El ID del tipo de descuento debe ser un número positivo' })
  discountTypeId: number;

  @ApiProperty({
    description: 'Descripción detallada del descuento',
    example: 'Descuento por buen comportamiento de pago a cuota, para que pague',
    type: 'string'
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  description: string;

  @ApiProperty({
    description: 'ID de la moratoria asociada',
    example: 1,
    type: 'number'
  })
  @IsNumber({}, { message: 'El ID de la moratoria debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la moratoria es requerido' })
  @IsPositive({ message: 'El ID de la moratoria debe ser un número positivo' })
  moratoryId: number;
} 