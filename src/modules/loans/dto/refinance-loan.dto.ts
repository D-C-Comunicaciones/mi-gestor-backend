import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class RefinanceLoanDto {
    @ApiPropertyOptional({ description: 'ID de la nueva tasa de interés' })
    @IsInt()
    @IsOptional()
    interestRateId?: number;

    @ApiPropertyOptional({ description: 'ID de la nueva tasa de interés moratoria (si aplica)' })
    @IsInt()
    @IsOptional()
    penaltyRateId?: number;

    @ApiPropertyOptional({ description: 'Nuevo ID de frecuencia de pago' })
    @IsInt()
    @IsOptional()
    paymentFrequencyId?: number;

    @ApiPropertyOptional({ description: 'Nuevo plazo (en meses, si aplica)' })
    @IsInt()
    @IsPositive()
    @IsOptional()
    termId?: number;

    @ApiPropertyOptional({ description: 'Nuevo período de gracia (si aplica)' })
    @IsInt()
    @IsOptional()
    gracePeriodId?: number;
}
