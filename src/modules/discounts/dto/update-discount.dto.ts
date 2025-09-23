import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountDto } from './create-discount.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la actualización de un descuento existente
 * Hereda de CreateDiscountDto pero hace todos los campos opcionales
 * Permite actualizaciones parciales del descuento
 */
export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  @ApiProperty({
    description: 'Nombre descriptivo del descuento',
    example: 'Descuento por fidelidad',
    type: 'string',
    maxLength: 100,
    required: false
  })
  name?: string;

  @ApiProperty({
    description: 'Descripción detallada del descuento',
    example: 'Descuento especial para clientes con más de 2 años de antigüedad',
    type: 'string',
    maxLength: 500,
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Tipo de descuento',
    example: 'FIXED_AMOUNT',
    type: 'string',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    required: false
  })
  discountType?: string;

  @ApiProperty({
    description: 'Valor del descuento',
    example: 25000,
    type: 'number',
    minimum: 0,
    required: false
  })
  value?: number;

  @ApiProperty({
    description: 'Monto máximo de descuento aplicable',
    example: 100000,
    type: 'number',
    minimum: 0,
    required: false
  })
  maxAmount?: number;

  @ApiProperty({
    description: 'Monto mínimo del préstamo para aplicar descuento',
    example: 200000,
    type: 'number',
    minimum: 0,
    required: false
  })
  minLoanAmount?: number;

  @ApiProperty({
    description: 'Número máximo de aplicaciones del descuento',
    example: 3,
    type: 'integer',
    minimum: 0,
    required: false
  })
  maxApplications?: number;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia',
    example: '2025-02-01',
    type: 'string',
    format: 'date',
    required: false
  })
  validFrom?: string;

  @ApiProperty({
    description: 'Fecha de fin de vigencia',
    example: '2025-11-30',
    type: 'string',
    format: 'date',
    required: false
  })
  validTo?: string;

  @ApiProperty({
    description: 'Estado activo del descuento',
    example: false,
    type: 'boolean',
    required: false
  })
  isActive?: boolean;
}
