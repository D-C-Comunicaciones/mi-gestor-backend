import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryCollectionQueryDto {
  @ApiPropertyOptional({
    description: 'ID del cliente para filtrar los recaudos.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional({
    description: 'ID del préstamo para filtrar los recaudos.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loanId?: number;
}