import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectorDto } from './create-collector.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsDateString, IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateCollectorDto extends PartialType(CreateCollectorDto) {
  @ApiPropertyOptional({ example: 'Carlos', description: 'Nuevo nombre' })
  @IsOptional() @IsString() firstName?: string;

  @ApiPropertyOptional({ example: 'Ramírez', description: 'Nuevo apellido' })
  @IsOptional() @IsString() lastName?: string;

  @ApiPropertyOptional({ example: 2, description: 'Nuevo tipo de documento' })
  @IsOptional() @IsInt() typeDocumentIdentificationId?: number;

  @ApiPropertyOptional({ example: 987654321, description: 'Nuevo número de documento (único)' })
  @IsOptional() @IsInt() documentNumber?: number;

  @ApiPropertyOptional({ example: '1991-06-20', description: 'Nueva fecha de nacimiento' })
  @IsOptional() @IsDateString() birthDate?: string;

  @ApiPropertyOptional({ example: 2, description: 'Nuevo género' })
  @IsOptional() @IsInt() genderId?: number;

  @ApiPropertyOptional({ example: '+573009998887', description: 'Nuevo teléfono' })
  @IsOptional() @IsPhoneNumber('CO') phone?: string;

  @ApiPropertyOptional({ example: 'Av 12 #34-56', description: 'Nueva dirección' })
  @IsOptional() @IsString() address?: string;

  @ApiPropertyOptional({ example: 'nuevo@migestor.com', description: 'Nuevo email (único)' })
  @IsOptional() @IsEmail() email?: string;

  @ApiPropertyOptional({ example: false, description: 'Cambiar estado activo' })
  @IsOptional() isActive?: boolean;
}