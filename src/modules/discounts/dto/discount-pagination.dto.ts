import { PaginationDto } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class DiscountPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ example: true, description: 'Filtrar por descuentos activos/inactivos' })
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

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de cuota' })
  @IsOptional()
  installmentId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filtrar por ID de préstamo' })
  @IsOptional()
  loanId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de interes moratorio' })
  @IsOptional()
  moratoryId?: number;

}
