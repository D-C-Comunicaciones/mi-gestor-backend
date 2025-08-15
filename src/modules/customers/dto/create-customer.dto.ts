import { IsInt, IsNotEmpty, IsOptional, IsString, IsDateString, IsEmail, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ana', description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty() firstName: string;

  @ApiProperty({ example: 'García', description: 'Apellido del cliente' })
  @IsString() @IsNotEmpty() lastName: string;

  @ApiProperty({ example: 1, description: 'ID tipo de documento' })
  @IsInt() @IsPositive() typeDocumentIdentificationId: number;

  @ApiProperty({ example: 1122233344, description: 'Número de documento (único)' })
  @IsInt() @IsPositive() documentNumber: number;

  @ApiProperty({ example: '1992-09-21', description: 'Fecha de nacimiento' })
  @IsDateString() birthDate: string;

  @ApiProperty({ example: 1, description: 'ID género' })
  @IsInt() @IsPositive() genderId: number;

  @ApiProperty({ example: '+573009998887', description: 'Teléfono contacto' })
  @IsString() @IsNotEmpty() phone: string;

  @ApiProperty({ example: 'Carrera 7 #12-34', description: 'Dirección' })
  @IsString() @IsNotEmpty() address: string;

  @ApiPropertyOptional({ example: 2, description: 'Zona asignada (opcional)' })
  @IsOptional() @IsInt() @IsPositive() zoneId?: number;

  @ApiProperty({ example: 'cliente1@migestor.com', description: 'Email único' })
  @IsEmail() email: string;
}