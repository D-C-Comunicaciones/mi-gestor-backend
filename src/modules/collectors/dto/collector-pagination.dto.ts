import { PaginationDto } from "@common/dto";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class CollectorPaginationDto extends PaginationDto {
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
