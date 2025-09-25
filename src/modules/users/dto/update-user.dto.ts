import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario_actualizado@ejemplo.com',
    type: 'string',
    format: 'email',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email?: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez Actualizado',
    type: 'string',
    minLength: 2,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'newpassword123',
    type: 'string',
    minLength: 6,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+57 300 987 6543',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;
}
