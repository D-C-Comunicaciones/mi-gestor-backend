import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de cobrador
 * Contiene la información completa de un cobrador del sistema
 * Utilizado en consultas y reportes de personal de cobranza
 */
export class ResponseCollectorDto {
  @ApiProperty({
    description: 'Identificador único del cobrador',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Nombres del cobrador',
    example: 'María Elena',
    type: 'string',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del cobrador',
    example: 'Rodríguez García',
    type: 'string',
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: 'Número de documento de identidad del cobrador',
    example: '87654321',
    type: 'string',
  })
  @Expose()
  documentNumber: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cobrador',
    example: '1985-03-15',
    type: 'string',
    format: 'date',
  })
  @Expose()
  birthDate: string;

  @ApiProperty({
    description: 'Número de teléfono móvil del cobrador',
    example: '3001234567',
    type: 'string',
  })
  @Expose()
  phone: string;

  @ApiProperty({
    description: 'Dirección de residencia del cobrador',
    example: 'Calle 45 #23-15, Barrio Centro',
    type: 'string',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'Correo electrónico del cobrador',
    example: 'maria.rodriguez@empresa.com',
    type: 'string',
    format: 'email',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'ID del tipo de documento de identidad',
    example: 1,
    type: 'integer',
  })
  @Expose()
  typeDocumentIdentificationId: number;

  @ApiProperty({
    description: 'ID del género del cobrador',
    example: 2,
    type: 'integer',
  })
  @Expose()
  genderId: number;

  @ApiProperty({
    description: 'ID de la zona asignada al cobrador',
    example: 2,
    type: 'integer',
    required: false,
  })
  @Expose()
  zoneId?: number;

  @ApiProperty({
    description: 'Indica si el cobrador está activo en el sistema',
    example: true,
    type: 'boolean',
    default: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T08:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-20T14:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  updatedAt: Date;
}