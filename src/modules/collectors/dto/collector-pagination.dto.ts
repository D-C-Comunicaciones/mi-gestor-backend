import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from "@common/dto";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class CollectorPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Página solicitada (>=1)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Tamaño de página (>=1)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 10;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por estado activo' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const val = value.toLowerCase();
      return val === 'true' || val === '1';
    }
    return Boolean(value);
  })
  @IsBoolean()
  isActive?: boolean;
}
