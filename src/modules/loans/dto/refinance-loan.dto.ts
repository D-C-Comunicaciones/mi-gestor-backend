import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class RefinanceLoanDto {
    @ApiPropertyOptional({ description: 'ID de la nueva tasa de interés corriente' })
    @IsInt()
    @IsOptional()
    interestRateId?: number;

    @ApiPropertyOptional({ description: 'ID de la nueva tasa de interés moratoria.' })
    @IsInt()
    @IsOptional()
    penaltyRateId?: number;

    @ApiPropertyOptional({ description: 'Nuevo ID de frecuencia de pago' })
    @IsInt()
    @IsOptional()
    paymentFrequencyId?: number;

    @ApiPropertyOptional({ description: 'Nuevo número de cuotas (Aplica solo para créditos de cuotas fijas)' })
    @IsInt()
    @IsPositive()
    @IsOptional()
    termId?: number;

    @ApiPropertyOptional({ description: 'Nuevo período de gracia (aplica solo para créditos de interés mensual)' })
    @IsInt()
    @IsOptional()
    gracePeriodId?: number;
}
