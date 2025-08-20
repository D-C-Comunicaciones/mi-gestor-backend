import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class LoanPaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Página solicitada (>=1)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Tamaño de página (>=1)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 10;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por activo' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    return value === true;
  })
  @IsBoolean()
  isActive?: boolean;
  
  @ApiPropertyOptional({ example: 'customer,installments', description: 'Relaciones a incluir' })
  @IsOptional()
  include?: string;
}
