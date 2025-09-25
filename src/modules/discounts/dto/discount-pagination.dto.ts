import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class DiscountPaginationDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    type: 'number',
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    type: 'number',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Término de búsqueda para filtrar descuentos por descripción',
    example: 'buen comportamiento',
    type: 'string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ID de moratoria específica',
    example: 1,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de moratoria debe ser un número' })
  moratoryId?: number;

  @ApiProperty({
    description: 'Filtrar por ID de tipo de descuento',
    example: 1,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de tipo de descuento debe ser un número' })
  discountTypeId?: number;
}
