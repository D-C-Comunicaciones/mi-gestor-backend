import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsPhoneNumber, IsDateString, IsEmail } from 'class-validator';

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

  @ApiProperty({ example: 1234567890, description: 'Número de documento (único)' })
  @IsInt()
  documentNumber: number;

  @ApiProperty({ example: '1990-05-14', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 1, description: 'ID del género' })
  @IsInt()
  genderId: number;

  @ApiProperty({ example: '+573001234567', description: 'Teléfono en formato internacional' })
  @IsString()
  @IsPhoneNumber('CO')
  phone: string;

  @ApiProperty({ example: 'Calle 111#16-21', description: 'Dirección de residencia' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'cobrador1@migestor.com', description: 'Email único del cobrador' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: true, description: 'Estado inicial (por defecto true)' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'ID de usuario (normalmente se genera automáticamente)' })
  @IsOptional()
  @IsInt()
  userId?: number;
}
