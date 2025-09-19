import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de un nuevo recaudo/cobro
 * Define los campos requeridos para registrar un pago realizado a una cuota específica
 */
export class CreateCollectionDto {

  @ApiProperty({
    description: 'ID de la cuota que se está pagando',
    example: 25,
    type: 'integer',
    minimum: 1
  })
  @IsNumber()
  installmentId: number; // <-- ID de la cuota que se está pagando

  @ApiProperty({
    description: 'Monto del pago realizado',
    example: 125000,
    type: 'number',
    minimum: 0.01
  })
  @IsNumber()
  @IsPositive()
  amount: number;

}
