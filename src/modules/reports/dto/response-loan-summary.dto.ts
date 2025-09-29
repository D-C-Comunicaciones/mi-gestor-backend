import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LoanSummaryReportDetailDto {
  @ApiProperty({ description: 'ID del préstamo', example: 10 })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: 'Monto del préstamo', example: 1500000.50 })
  @IsNumber()
  @Type(() => Number)
  loanAmount: number;

  @ApiProperty({ description: 'Saldo restante del préstamo', example: 800000.25 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  remainingBalance?: number;

  @ApiProperty({ description: 'Fecha de inicio del préstamo', example: '2025-01-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Estado del préstamo', example: 'Up to Date' })
  @IsString()
  loanStatusName: string;

  @ApiProperty({ description: 'Tipo de crédito', example: 'fixed_fees', required: false })
  @IsOptional()
  @IsString()
  creditTypeName?: string;

  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: 'Documento del cliente', example: 111222333, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerDocument?: number;

  @ApiProperty({ description: 'Dirección del cliente', example: 'Calle 100 #50-60', required: false })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ description: 'Teléfono del cliente', example: '3005556666', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ description: 'Objeto interestRate crudo', required: false, type: Object })
  @IsOptional()
  @Type(() => Object)
  interestRate?: any;

  @ApiProperty({ description: 'Objeto penaltyRate crudo', required: false, type: Object })
  @IsOptional()
  @Type(() => Object)
  penaltyRate?: any;

  @ApiProperty({ description: 'Indica si es refinanciado', required: false })
  @IsOptional()
  isRefinanced?: boolean;

  @ApiProperty({ description: 'Valor de la tasa de interés', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  interestRateValue?: number;

  @ApiProperty({ description: 'Valor de la tasa de mora', example: 0.05, required: false })
  @IsOptional()
  @Type(() => Number)
  penaltyRateValue?: number;
}

export class ResponseLoanSummaryReportDto {
  @ApiProperty({ description: 'Número de créditos nuevos', example: 5 })
  @IsOptional()
  @Type(() => Number)
  numberOfNewLoans?: number;

  @ApiProperty({ description: 'Valor total de los créditos nuevos', example: 1500000.50, required: false })
  @IsOptional()
  @Type(() => Number)
  newLoansTotalAmount?: number;

  @ApiProperty({ description: 'Lista de créditos nuevos', type: [LoanSummaryReportDetailDto] })
  @ValidateNested({ each: true })
  @Type(() => LoanSummaryReportDetailDto)
  newLoansDetails?: LoanSummaryReportDetailDto[];

  @ApiProperty({ description: 'Número de créditos refinanciados', example: 2 })
  @IsOptional()
  @Type(() => Number)
  numberOfRefinancedLoans?: number;

  @ApiProperty({ description: 'Valor total de los créditos refinanciados', example: 2500000.00, required: false })
  @IsOptional()
  @Type(() => Number)
  refinancedLoansTotalAmount?: number;

  @ApiProperty({ description: 'Lista de créditos refinanciados', type: [LoanSummaryReportDetailDto] })
  @ValidateNested({ each: true })
  @Type(() => LoanSummaryReportDetailDto)
  refinancedLoansDetails?: LoanSummaryReportDetailDto[];
}