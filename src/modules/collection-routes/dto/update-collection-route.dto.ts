import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateCollectionRouteDto } from './create-collection-route.dto';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCollectionRouteDto extends PartialType(CreateCollectionRouteDto) {
  @ApiPropertyOptional({
    description: 'ID del cobrador asignado a la ruta',
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: 'El ID del cobrador debe ser un número entero' })
  collectorId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de la ruta de cobranza',
    example: 'Ruta Norte - Zona 2',
    minLength: 3,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name?: string;
}
