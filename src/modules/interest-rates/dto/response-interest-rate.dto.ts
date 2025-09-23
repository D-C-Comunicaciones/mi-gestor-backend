import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de tasa de interés corriente
 * Contiene la información básica de una tasa de interés que se retorna al cliente
 * Utilizado en la creación y refinanciación de préstamos
 */
export class ResponseInterestRateDto {
  @ApiProperty({
    description: 'Identificador único de la tasa de interés',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre descriptivo de la tasa de interés',
    example: '2.5% Mensual',
    type: 'string',
    maxLength: 100
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Valor numérico de la tasa de interés (expresado como decimal)',
    example: 0.025,
    type: 'number',
    minimum: 0,
    maximum: 1,
    multipleOf: 0.0001
  })
  @Expose()
  value: number;

  @ApiProperty({
    description: 'Porcentaje de la tasa de interés para visualización',
    example: '2.50%',
    type: 'string',
    readOnly: true
  })
  @Expose()
  percentage?: string;

  @ApiProperty({
    description: 'Descripción detallada de la tasa de interés y sus condiciones',
    example: 'Tasa preferencial para clientes con buen historial crediticio, aplicable a préstamos de libre inversión',
    type: 'string',
    maxLength: 500,
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Indica si la tasa de interés está activa y disponible para nuevos préstamos',
    example: true,
    type: 'boolean',
    default: true
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la tasa de interés',
    example: '2025-01-04T18:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Expose()
  createdAt?: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la tasa de interés',
    example: '2025-01-04T18:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Expose()
  updatedAt?: Date;
}