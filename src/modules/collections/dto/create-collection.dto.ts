import { IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CreateCollectionDto {
  @IsNumber()
  loanId: number;

  @IsNumber()
  customerId: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsNumber()
  collectorId?: number;
}
