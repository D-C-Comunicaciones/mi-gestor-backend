import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @Type(() => Number) // Primero transforma
  @IsOptional()
  @IsPositive()
  page?: number;

  @Type(() => Number) // Primero transforma
  @IsOptional()
  @IsPositive()
  limit?: number;
}