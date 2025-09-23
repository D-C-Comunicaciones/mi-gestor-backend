import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de descuento
 * Contiene la información completa de un descuento del sistema
 * Utilizado en consultas y aplicación de descuentos a préstamos
 */
export class ResponseDiscountDto {
  @ApiProperty({
    description: 'Identificador único del descuento',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre descriptivo del descuento',
    example: 'Descuento por pago anticipado',
    type: 'string'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del descuento y sus condiciones',
    example: 'Descuento aplicable a clientes que pagan su cuota antes del vencimiento',
    type: 'string',
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Tipo de descuento (porcentaje o monto fijo)',
    example: 'PERCENTAGE',
    type: 'string',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT']
  })
  @Expose()
  discountType: string;

  @ApiProperty({
    description: 'Valor del descuento (porcentaje o monto según el tipo)',
    example: 5.0,
    type: 'number',
    minimum: 0
  })
  @Expose()
  value: number;

  @ApiProperty({
    description: 'Monto máximo de descuento aplicable (para descuentos porcentuales)',
    example: 50000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @Expose()
  maxAmount?: number;

  @ApiProperty({
    description: 'Monto mínimo del préstamo para aplicar el descuento',
    example: 100000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @Expose()
  minLoanAmount?: number;

  @ApiProperty({
    description: 'Número máximo de veces que se puede aplicar el descuento',
    example: 1,
    type: 'integer',
    minimum: 0,
    required: false
  })
  @Expose()
  maxApplications?: number;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia del descuento',
    example: '2025-01-01',
    type: 'string',
    format: 'date',
    required: false
  })
  @Expose()
  validFrom?: string;

  @ApiProperty({
    description: 'Fecha de fin de vigencia del descuento',
    example: '2025-12-31',
    type: 'string',
    format: 'date',
    required: false
  })
  @Expose()
  validTo?: string;

  @ApiProperty({
    description: 'Indica si el descuento está activo y disponible',
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
