import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsPhoneNumber, IsDateString } from 'class-validator';

export class UpdateCollectorDto {
  @ApiPropertyOptional({ example: 'Juan', description: 'Nombre del colector' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez', description: 'Apellido del colector' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de documento' })
  @IsOptional()
  @IsInt()
  typeDocumentIdentificationId?: number;

  @ApiPropertyOptional({ example: '1234567890', description: 'Número de documento del colector' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Fecha de nacimiento del colector' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del género' })
  @IsOptional()
  @IsInt()
  genderId?: number;

  @ApiPropertyOptional({ example: '+573001234567', description: 'Número de teléfono del colector (formato internacional CO)' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('CO')
  phone?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID de la zona (opcional)' })
  @IsOptional()
  @IsInt()
  zoneId?: number;

  @ApiPropertyOptional({ example: 5, description: 'ID del usuario asociado (opcional)' })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: true, description: 'Indica si el colector está activo (opcional)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}