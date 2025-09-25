import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para la actualización de una empresa existente
 * Hereda de CreateCompanyDto pero hace todos los campos opcionales
 * Permite actualizaciones parciales de la información corporativa
 */
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({
    description: 'Nombre de la empresa',
    example: 'Mi Gestor Financiero Actualizado S.A.S',
    type: 'string',
    maxLength: 150,
    required: false
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'NIT de la empresa',
    example: '900123456',
    type: 'string',
    maxLength: 15,
    required: false
  })
  nit?: string;

  @ApiPropertyOptional({
    description: 'Dígito de verificación del NIT',
    example: '7',
    type: 'string',
    maxLength: 1,
    required: false
  })
  verificationDigit?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de la empresa',
    example: '+57 1 987 6543',
    type: 'string',
    maxLength: 20,
    required: false
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de la empresa',
    example: 'nuevo@migestorfinanciero.com',
    type: 'string',
    format: 'email',
    maxLength: 100,
    required: false
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Dirección física de la empresa',
    example: 'Carrera 15 #93-40, Torre Empresarial, Piso 12',
    type: 'string',
    maxLength: 200,
    required: false
  })
  address?: string;
}
