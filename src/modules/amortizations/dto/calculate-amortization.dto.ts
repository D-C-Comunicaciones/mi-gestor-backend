import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsNotEmpty, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para el cálculo de tabla de amortización
 * Define los parámetros necesarios para generar el cronograma de pagos de un préstamo
 * Utilizado para simular créditos antes de la originación
 */
export class CalculateAmortizationDto {
  @ApiProperty({
    description: 'Monto del crédito en pesos colombianos',
    example: 1000000,
    type: 'number',
    minimum: 1
  })
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  @Min(1, { message: 'El monto mínimo es 1' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Tasa de interés anual en porcentaje (ejemplo: 24 para 24% anual)',
    example: 24,
    type: 'number',
    minimum: 0.01,
    maximum: 100
  })
  @IsNumber({}, { message: 'La tasa de interés debe ser un número válido' })
  @IsNotEmpty({ message: 'La tasa de interés es obligatoria' })
  @IsPositive({ message: 'La tasa de interés debe ser mayor a cero' })
  @Min(0.01, { message: 'La tasa de interés mínima es 0.01%' })
  @Type(() => Number)
  interestRate: number;

  @ApiProperty({
    description: 'Número de cuotas del préstamo',
    example: 12,
    type: 'integer',
    minimum: 1,
    maximum: 360
  })
  @IsNumber({}, { message: 'El plazo debe ser un número válido' })
  @IsNotEmpty({ message: 'El plazo es obligatorio' })
  @IsPositive({ message: 'El plazo debe ser mayor a cero' })
  @Min(1, { message: 'El plazo mínimo es 1 cuota' })
  @Type(() => Number)
  term: number;
}