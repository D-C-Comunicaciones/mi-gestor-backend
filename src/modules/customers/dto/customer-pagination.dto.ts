import { IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerPaginationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar clientes por estado activo/inactivo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar clientes por estado de asignación a una ruta. `true` para asignados, `false` para no asignados.',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  assigned?: boolean;
}