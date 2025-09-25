import { Decimal } from '@prisma/client/runtime/library';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de una asignación de pago
 * Define cómo se distribuye un pago entre capital, intereses y mora
 * Utilizado internamente por el sistema de collections
 */
export class CreateAllocationDto {
    @ApiProperty({ 
        description: 'ID del pago al que pertenece esta asignación', 
        example: 25,
        type: 'integer'
    })
    paymentId: number;

    @ApiProperty({ 
        description: 'ID de la cuota a la que se aplica esta asignación', 
        example: 3,
        type: 'integer'
    })
    installmentId: number;

    @ApiProperty({ 
        description: 'Monto aplicado al capital como string decimal', 
        example: '0.00',
        type: 'string'
    })
    appliedToCapital: Decimal;

    @ApiProperty({ 
        description: 'Monto aplicado a intereses como string decimal', 
        example: '0.00',
        type: 'string'
    })
    appliedToInterest: Decimal;

    @ApiProperty({ 
        description: 'Monto aplicado a mora como string decimal', 
        example: '0.00',
        type: 'string'
    })
    appliedToLateFee: Decimal;
}
