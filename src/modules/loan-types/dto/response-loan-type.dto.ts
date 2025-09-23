import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de tipo de préstamo
 * Contiene la información completa de un tipo de préstamo disponible en el sistema
 * Utilizado en la selección de productos durante la originación de créditos
 */
export class ResponseLoanTypeDto {
  @ApiProperty({
    description: 'Identificador único del tipo de préstamo',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre del tipo de préstamo',
    example: 'Crédito Personal',
    type: 'string'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del tipo de préstamo',
    example: 'Crédito personal para libre inversión con pagos mensuales',
    type: 'string',
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Modalidad de pago del préstamo',
    example: 'Monthly',
    type: 'string',
    enum: ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Biannual', 'Annual']
  })
  @Expose()
  paymentFrequency: string;

  @ApiProperty({
    description: 'Tasa de interés anual del tipo de préstamo',
    example: 24.5,
    type: 'number',
    minimum: 0
  })
  @Expose()
  interestRate: number;

  @ApiProperty({
    description: 'Monto mínimo de préstamo para este tipo',
    example: 100000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  minAmount: number;

  @ApiProperty({
    description: 'Monto máximo de préstamo para este tipo',
    example: 5000000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  maxAmount: number;

  @ApiProperty({
    description: 'Plazo mínimo en la unidad de frecuencia de pago',
    example: 6,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  minTerm: number;

  @ApiProperty({
    description: 'Plazo máximo en la unidad de frecuencia de pago',
    example: 60,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  maxTerm: number;

  @ApiProperty({
    description: 'Indica si permite períodos de gracia',
    example: true,
    type: 'boolean'
  })
  @Expose()
  allowsGracePeriod: boolean;

  @ApiProperty({
    description: 'Indica si requiere garantías o avales',
    example: false,
    type: 'boolean'
  })
  @Expose()
  requiresCollateral: boolean;

  @ApiProperty({
    description: 'Indica si el tipo de préstamo está disponible para originar',
    example: true,
    type: 'boolean',
    default: true
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T08:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-20T14:45:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  updatedAt: Date;
}
