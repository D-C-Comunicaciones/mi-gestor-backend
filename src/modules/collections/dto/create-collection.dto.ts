import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para la creación de un nuevo cobro
 * Define los campos requeridos para registrar un pago a una cuota específica
 * Utilizado por cobradores para registrar recaudos en sus rutas
 */
export class CreateCollectionDto {

  @ApiProperty({
    description: 'ID de la cuota que se está pagando',
    example: 3,
    type: 'integer',
    minimum: 1
  })
  @IsNumber({}, { message: 'El ID de la cuota debe ser un número' })
  @Type(() => Number)
  installmentId: number; // <-- ID de la cuota que se está pagando

  @ApiProperty({
    description: 'Monto del pago realizado en pesos colombianos',
    example: 146763.32,
    type: 'number',
    minimum: 0.01
  })
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  @Type(() => Number)
  amount: number;
}
