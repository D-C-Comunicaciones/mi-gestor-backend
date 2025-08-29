import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CollectionPaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  loanId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  collectorId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;
}
