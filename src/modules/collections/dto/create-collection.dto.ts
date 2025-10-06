import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';

/**
 * DTO para la creación de un nuevo cobro
 * Define los campos requeridos para registrar un pago a una cuota específica
 * Utilizado por cobradores para registrar recaudos en sus rutas
 */
export class CreateCollectionDto {

  @ApiProperty({
    description: 'ID del préstamo al cual se aplicará el cobro',
    example: 2,
    type: 'number'
  })
  @IsNumber({}, { message: 'El ID del préstamo debe ser un número' })
  @IsNotEmpty({ message: 'El ID del préstamo es requerido' })
  @IsPositive({ message: 'El ID del préstamo debe ser un número positivo' })
  loanId: number;

  @ApiProperty({
    description: 'Monto del cobro en pesos colombianos',
    example: 146763.32,
    type: 'number'
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsNotEmpty({ message: 'El monto es requerido' })
  @IsPositive({ message: 'El monto debe ser un número positivo' })
  amount: number;

  @ApiProperty({
    description: 'ID del método de pago (opcional, por defecto efectivo)',
    example: 1,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del método de pago debe ser un número' })
  @IsPositive({ message: 'El ID del método de pago debe ser un número positivo' })
  paymentMethodId?: number; // <-- ID del método de pago (opcional, por defecto 'efectivo' con ID 1)
}
