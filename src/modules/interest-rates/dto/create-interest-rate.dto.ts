import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de una nueva tasa de interés corriente
 * Define los campos requeridos y validaciones para crear una tasa de interés
 * Utilizado por administradores para configurar nuevas tasas de préstamos
 */
export class CreateInterestRateDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la tasa de interés. Debe incluir el porcentaje y periodicidad',
    example: '2.5% Mensual',
    type: 'string',
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Valor decimal de la tasa de interés. Para 2.5% mensual, usar 0.025',
    example: 0.025,
    type: 'number',
    minimum: 0,
    maximum: 1,
    multipleOf: 0.0001
  })
  @IsNumber(
    { maxDecimalPlaces: 6 }, 
    { message: 'El valor debe ser un número decimal válido con máximo 6 decimales' }
  )
  @Min(0, { message: 'El valor de la tasa no puede ser negativo' })
  @Max(1, { message: 'El valor de la tasa no puede ser mayor a 1 (100%)' })
  @Type(() => Number)
  value: number;

  @ApiProperty({
    description: 'Descripción detallada de la tasa de interés, condiciones y aplicabilidad',
    example: 'Tasa preferencial para clientes con buen historial crediticio, aplicable a préstamos de libre inversión hasta 24 meses',
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
    description: 'Indica si la tasa estará activa y disponible para nuevos préstamos inmediatamente',
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
