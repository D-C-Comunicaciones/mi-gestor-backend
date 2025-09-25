import { PartialType } from '@nestjs/mapped-types';
import { CreateLoantypeDto } from './create-loantype.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la actualización de un tipo de crédito existente
 * Hereda de CreateLoantypeDto pero hace todos los campos opcionales
 * Permite actualizaciones parciales del tipo de crédito
 */
export class UpdateLoantypeDto extends PartialType(CreateLoantypeDto) {
  @ApiProperty({
    description: 'Nombre único del tipo de crédito. Debe ser en mayúsculas y puede contener guiones bajos',
    example: 'INTERES_MENSUAL',
    type: 'string',
    maxLength: 100,
    pattern: '^[A-Z_]+$',
    required: false
  })
  name?: string;

  @ApiProperty({
    description: 'Descripción detallada del tipo de crédito que explique sus características y funcionamiento',
    example: 'Crédito donde solo se pagan intereses mensuales y el capital se paga al final del período',
    type: 'string',
    maxLength: 500,
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Indica si el tipo de crédito está activo y disponible para su uso',
    example: false,
    type: 'boolean',
    required: false
  })
  isActive?: boolean;
}
