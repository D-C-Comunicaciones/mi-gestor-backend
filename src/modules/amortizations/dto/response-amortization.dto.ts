import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO para un elemento individual del cronograma de amortización
 * Representa una cuota específica con su desglose de capital e intereses
 */
export class AmortizationScheduleItem {
  @ApiProperty({
    description: 'Número de la cuota en la secuencia del préstamo',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  installment: number;

  @ApiProperty({
    description: 'Monto aplicado al capital en esta cuota',
    example: 75692.31,
    type: 'number',
    minimum: 0
  })
  @Expose()
  capitalAmount: number;

  @ApiProperty({
    description: 'Monto correspondiente a intereses en esta cuota',
    example: 20000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  interestAmount: number;

  @ApiProperty({
    description: 'Pago total de la cuota (capital + intereses)',
    example: 95692.31,
    type: 'number',
    minimum: 0
  })
  @Expose()
  totalInstallment: number;

  @ApiProperty({
    description: 'Saldo restante del préstamo después de pagar esta cuota',
    example: 924307.69,
    type: 'number',
    minimum: 0
  })
  @Expose()
  remainingBalance: number;
}

/**
 * DTO para la respuesta completa del cálculo de amortización
 * Contiene los parámetros del préstamo y el cronograma detallado de pagos
 */
export class AmortizationResponseDto {
  @ApiProperty({
    description: 'Monto del crédito utilizado para el cálculo',
    example: 1000000,
    type: 'number'
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Tasa de interés anual en porcentaje utilizada',
    example: 24,
    type: 'number'
  })
  @Expose()
  interestRate: number;

  @ApiProperty({
    description: 'Número de cuotas del préstamo',
    example: 12,
    type: 'integer'
  })
  @Expose()
  term: number;

  @ApiProperty({
    description: 'Cronograma detallado de amortización con cada cuota',
    type: [AmortizationScheduleItem],
    isArray: true
  })
  @Expose()
  amortizationSchedule: AmortizationScheduleItem[];
}
