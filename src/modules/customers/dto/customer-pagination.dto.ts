import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerPaginationDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 10;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
}