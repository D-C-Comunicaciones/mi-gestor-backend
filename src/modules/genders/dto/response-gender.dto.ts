import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de género
 * Contiene la información básica de un género del sistema
 * Utilizado en consultas y formularios de registro
 */
export class ResponseGenderDto {
  @ApiProperty({
    description: 'Identificador único del género',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombre del género',
    example: 'Masculino',
    type: 'string'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Descripción del género',
    example: 'Género masculino',
    type: 'string',
    required: false
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Indica si el género está activo en el sistema',
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