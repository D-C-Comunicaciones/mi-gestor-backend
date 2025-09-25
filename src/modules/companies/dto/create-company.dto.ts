import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumberString, IsOptional, IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para la creación de una empresa
 * Define los campos requeridos para registrar una empresa en el sistema
 * Utilizado por administradores para configurar la información corporativa
 */
export class CreateCompanyDto {
  @ApiProperty({ 
    description: 'Nombre de la empresa',
    example: 'Mi Gestor Financiero S.A.S',
    type: 'string',
    maxLength: 150
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ 
    description: 'NIT de la empresa (solo números)',
    example: '900123456',
    type: 'string',
    maxLength: 15
  })
  @IsNumberString({}, { message: 'El NIT debe contener solo números' })
  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  @MaxLength(15, { message: 'El NIT no puede exceder 15 caracteres' })
  nit: string;

  @ApiPropertyOptional({ 
    description: 'Dígito de verificación del NIT',
    example: '7',
    type: 'string',
    maxLength: 1
  })
  @IsOptional()
  @IsNumberString({}, { message: 'El dígito de verificación debe ser un número' })
  @MaxLength(1, { message: 'El dígito de verificación debe ser un solo carácter' })
  verificationDigit?: string;

  @ApiPropertyOptional({ 
    description: 'Número de teléfono de la empresa',
    example: '+57 1 234 5678',
    type: 'string',
    maxLength: 20
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Correo electrónico de la empresa',
    example: 'contacto@migestorfinanciero.com',
    type: 'string',
    format: 'email',
    maxLength: 100
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(100, { message: 'El email no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Dirección física de la empresa',
    example: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.',
    type: 'string',
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(200, { message: 'La dirección no puede exceder 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  address?: string;
}
