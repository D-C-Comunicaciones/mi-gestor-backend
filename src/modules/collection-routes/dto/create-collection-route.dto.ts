import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCollectionRouteDto {
  @ApiPropertyOptional({
    description: 'ID del cobrador asignado a la ruta (opcional)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'El ID del cobrador debe ser un número entero' })
  collectorId?: number;

  @ApiProperty({
    description: 'Nombre de la ruta de cobranza',
    example: 'Ruta Centro - Zona 1',
    minLength: 3,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la ruta es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

}
