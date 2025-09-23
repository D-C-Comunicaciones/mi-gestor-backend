import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de período de gracia
 * Contiene la información de un período de gracia disponible para créditos mensuales
 * Utilizado en la selección de períodos de gracia durante la creación de préstamos
 */
export class ResponseGracePeriodDto {
  @ApiProperty({
    description: 'Identificador único del período de gracia',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre del período de gracia',
    example: '3 meses',
    type: 'string'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del período de gracia',
    example: 'Período de gracia de 3 meses sin pagos de capital',
    type: 'string',
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Duración en meses del período de gracia',
    example: 3,
    type: 'integer',
    minimum: 0
  })
  @Expose()
  months: number;

  @ApiProperty({
    description: 'Indica si durante el período se pagan solo intereses',
    example: true,
    type: 'boolean'
  })
  @Expose()
  interestOnly: boolean;

  @ApiProperty({
    description: 'Indica si el período de gracia está disponible para uso',
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