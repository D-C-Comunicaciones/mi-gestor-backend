import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsPhoneNumber, IsDateString, IsEmail } from 'class-validator';

export class CreateCollectorDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del cobrador' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cobrador' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 1, description: 'ID del tipo de documento' })
  @IsInt()
  typeDocumentIdentificationId: number;

  @ApiProperty({ example: '1234567890', description: 'Número de documento del cobrador' })
  @IsString()
  documentNumber: string;

  @ApiProperty({ example: '1990-01-01', description: 'Fecha de nacimiento del cobrador' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 1, description: 'ID del género' })
  @IsInt()
  genderId: number;

  @ApiProperty({ example: '+573001234567', description: 'Número de teléfono del cobrador (formato internacional CO)' })
  @IsString()
  @IsPhoneNumber('CO')
  phone: string;

  @ApiProperty({ example: 'Calle 111#16-21', description: 'Dirección del estudiante' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'cobrador1@migestor.com', description: 'Correo electrónico del cobrador' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 2, description: 'ID de la zona (opcional)' })
  @IsOptional()
  @IsInt()
  zoneId?: number;

  @ApiPropertyOptional({ example: 5, description: 'ID del usuario asociado (opcional)' })
  @IsOptional()
  @IsInt()
  userId?: number;

}
