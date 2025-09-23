import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'nuevo@ejemplo.com',
    type: 'string',
    format: 'email'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    type: 'string',
    minLength: 6
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'María García',
    type: 'string',
    minLength: 2
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+57 300 123 4567',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;
}
