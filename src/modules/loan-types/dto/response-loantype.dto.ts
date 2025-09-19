import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de tipo de crédito
 * Contiene la información básica de un tipo de crédito que se retorna al cliente
 */
export class ResponseLoantypeDto {
  @ApiProperty({
    description: 'Identificador único del tipo de crédito',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre del tipo de crédito',
    example: 'CUOTA_FIJA',
    type: 'string',
    maxLength: 100,
    pattern: '^[A-Z_]+$'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del tipo de crédito',
    example: 'Crédito con cuotas fijas mensuales donde el monto de la cuota permanece constante durante toda la vida del préstamo',
    type: 'string',
    maxLength: 500,
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Indica si el tipo de crédito está activo y disponible para su uso',
    example: true,
    type: 'boolean',
    default: true
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del tipo de crédito',
    example: '2025-01-04T18:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Expose()
  createdAt?: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del tipo de crédito',
    example: '2025-01-04T18:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Expose()
  updatedAt?: Date;
}
