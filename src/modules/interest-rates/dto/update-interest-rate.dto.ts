import { PartialType } from '@nestjs/mapped-types';
import { CreateInterestRateDto } from './create-interest-rate.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la actualización de una tasa de interés existente
 * Hereda de CreateInterestRateDto pero hace todos los campos opcionales
 * Permite actualizaciones parciales de la tasa de interés
 */
export class UpdateInterestRateDto extends PartialType(CreateInterestRateDto) {
  @ApiProperty({
    description:
      'Nombre descriptivo de la tasa de interés. Debe incluir el porcentaje y periodicidad',
    example: '3.0% Mensual',
    type: 'string',
    maxLength: 100,
    required: false,
  })
  name?: string;

  @ApiProperty({
    description:
      'Valor decimal de la tasa de interés. Para 3.0% mensual, usar 0.03',
    example: 0.03,
    type: 'number',
    minimum: 0,
    maximum: 1,
    multipleOf: 0.0001,
    required: false,
  })
  value?: number;

  @ApiProperty({
    description:
      'Descripción detallada de la tasa de interés, condiciones y aplicabilidad',
    example:
      'Tasa estándar para préstamos comerciales con garantía hipotecaria',
    type: 'string',
    maxLength: 500,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description:
      'Indica si la tasa está activa y disponible para nuevos préstamos',
    example: false,
    type: 'boolean',
    required: false,
  })
  isActive?: boolean;
}
