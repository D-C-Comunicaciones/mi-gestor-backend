import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de un nuevo tipo de crédito
 * Define los campos requeridos y opcionales para crear un tipo de crédito
 */
export class CreateLoantypeDto {
  @ApiProperty({
    description: 'Nombre único del tipo de crédito. Debe ser en mayúsculas y puede contener guiones bajos',
    example: 'CUOTA_FIJA',
    type: 'string',
    maxLength: 100,
    pattern: '^[A-Z_]+$'
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[A-Z_]+$/, { 
    message: 'El nombre debe estar en mayúsculas y puede contener guiones bajos' 
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del tipo de crédito que explique sus características y funcionamiento',
    example: 'Crédito con cuotas fijas mensuales donde el monto de la cuota permanece constante durante toda la vida del préstamo. Ideal para clientes que prefieren pagos predecibles.',
    type: 'string',
    maxLength: 500,
    required: false
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'Indica si el tipo de crédito estará activo y disponible para su uso inmediatamente',
    example: true,
    type: 'boolean',
    default: true,
    required: false
  })
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean = true;
}
