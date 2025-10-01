import { PaginationDto } from "@common/dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsBoolean, IsInt } from "class-validator";
import { Transform, Type } from "class-transformer";

export class CollectionRoutesPaginationDto extends PaginationDto {
    
  @ApiPropertyOptional({ 
    description: 'Filter by active/inactive status', 
    example: true 
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === '1' || value === 1 || value === true) return true;
    if (value === 'false' || value === '0' || value === 0 || value === false) return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by collector ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  collectorId?: number;
}
