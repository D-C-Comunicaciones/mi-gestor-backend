import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateAdvanceDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  loanId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  collectorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
