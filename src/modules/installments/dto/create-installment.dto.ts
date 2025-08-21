// create-installment.dto.ts
import { IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';

export class CreateInstallmentDto {
  @IsInt()
  @IsPositive()
  loanId: number;

  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsInt()
  @IsPositive()
  paymentFrequencyId: number;

  @IsOptional() // 👈 Hacer opcional
  @IsInt()
  @IsPositive()
  count?: number; // 👈 Agregar count
}