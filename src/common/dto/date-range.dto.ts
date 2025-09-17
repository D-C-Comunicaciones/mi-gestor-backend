import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeDto {
  @ApiProperty({
    description: 'Fecha de inicio para el reporte (Formato YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para el reporte (Formato YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}