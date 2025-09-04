import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateDiscountDto {

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  installmentId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  moratoryId?: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  discountTypeId: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  percentageId?: number;

  @IsNotEmpty()
  @IsString()
  description: string;
}
