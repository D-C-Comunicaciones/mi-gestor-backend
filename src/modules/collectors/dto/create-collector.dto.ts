import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPhoneNumber, IsDateString, IsEmail } from 'class-validator';

/**
 * DTO para la creación de un nuevo cobrador
 * Define los campos requeridos y validaciones para registrar un cobrador en el sistema
 * Utilizado por administradores para gestionar el personal de cobranza
 */
export class CreateCollectorDto {
  @ApiProperty({
    description: 'Nombres del cobrador',
    example: 'María Elena',
    type: 'string',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del cobrador',
    example: 'Rodríguez García',
    type: 'string',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Número de documento de identidad único del cobrador',
    example: '87654321',
    type: 'string',
    maxLength: 20
  })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cobrador (formato YYYY-MM-DD)',
    example: '1985-03-15',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  birthDate: string;

  @ApiProperty({
    description: 'Número de teléfono móvil del cobrador',
    example: '3001234567',
    type: 'string',
    maxLength: 15
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Dirección de residencia del cobrador',
    example: 'Calle 45 #23-15, Barrio Centro',
    type: 'string',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Correo electrónico único del cobrador',
    example: 'maria.rodriguez@empresa.com',
    type: 'string',
    format: 'email',
    maxLength: 150
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'ID del tipo de documento de identidad',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @IsNumber()
  typeDocumentIdentificationId: number;

  @ApiProperty({
    description: 'ID del género del cobrador',
    example: 2,
    type: 'integer',
    minimum: 1
  })
  @IsNumber()
  genderId: number;

  @ApiProperty({
    description: 'ID de la zona que será asignada al cobrador',
    example: 2,
    type: 'integer',
    minimum: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  zoneId?: number;
}
