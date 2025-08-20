import { IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateInstallmentDto {
  @IsNumber()
  loanId: number; // FK al préstamo

  @IsNumber()
  @IsOptional()
  count?: number; // Número de cuotas a generar (opcional, puede calcularse internamente)

  @IsNumber()
  paymentFrequencyId: number; // FK a frecuencia de pago

  @IsDate()
  startDate: Date; // Fecha de primera cuota
}
