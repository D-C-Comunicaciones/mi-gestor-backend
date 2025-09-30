import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsBoolean, IsInt, Min, Max, IsNumber, IsDateString } from 'class-validator';

export class CollectionPaginationDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de elementos por página',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar por ID de préstamo',
    example: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loanId?: number;

  @ApiProperty({
    description: 'Filtrar por ID de cobrador',
    example: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  collectorId?: number;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar pagos',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar pagos',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
