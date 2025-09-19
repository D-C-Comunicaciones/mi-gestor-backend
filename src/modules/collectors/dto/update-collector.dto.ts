import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectorDto } from './create-collector.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO para la actualización de un cobrador existente
 * Hereda de CreateCollectorDto pero hace todos los campos opcionales
 * Permite actualizaciones parciales del cobrador
 */
export class UpdateCollectorDto extends PartialType(CreateCollectorDto) {
  @ApiProperty({
    description: 'Nombres del cobrador',
    example: 'María Elena',
    type: 'string',
    maxLength: 100,
    required: false
  })
  firstName?: string;

  @ApiProperty({
    description: 'Apellidos del cobrador',
    example: 'Rodríguez García',
    type: 'string',
    maxLength: 100,
    required: false
  })
  lastName?: string;

  @ApiProperty({
    description: 'Número de documento de identidad del cobrador',
    example: '87654321',
    type: 'string',
    maxLength: 20,
    required: false
  })
  documentNumber?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cobrador',
    example: '1985-03-15',
    type: 'string',
    format: 'date',
    required: false
  })
  birthDate?: string;

  @ApiProperty({
    description: 'Número de teléfono móvil del cobrador',
    example: '3001234567',
    type: 'string',
    maxLength: 15,
    required: false
  })
  phone?: string;

  @ApiProperty({
    description: 'Dirección de residencia del cobrador',
    example: 'Calle 45 #23-15, Barrio Centro',
    type: 'string',
    maxLength: 200,
    required: false
  })
  address?: string;

  @ApiProperty({
    description: 'Correo electrónico del cobrador',
    example: 'maria.rodriguez@empresa.com',
    type: 'string',
    format: 'email',
    maxLength: 150,
    required: false
  })
  email?: string;

  @ApiProperty({
    description: 'ID del tipo de documento de identidad',
    example: 1,
    type: 'integer',
    minimum: 1,
    required: false
  })
  typeDocumentIdentificationId?: number;

  @ApiProperty({
    description: 'ID del género del cobrador',
    example: 2,
    type: 'integer',
    minimum: 1,
    required: false
  })
  genderId?: number;

  @ApiProperty({
    description: 'ID de la zona asignada al cobrador',
    example: 3,
    type: 'integer',
    minimum: 1,
    required: false
  })
  zoneId?: number;

  @ApiProperty({
    description: 'Estado activo del cobrador',
    example: false,
    type: 'boolean',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}