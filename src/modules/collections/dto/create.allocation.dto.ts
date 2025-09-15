import { Decimal } from '@prisma/client/runtime/library';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAllocationDto {
    @ApiProperty({ type: Number, description: 'ID of the payment' })
    paymentId: number;

    @ApiProperty({ type: Number, description: 'ID of the installment' })
    installmentId: number;

    @ApiProperty({ type: String, description: 'Amount applied to capital as decimal string' })
    appliedToCapital: Decimal;

    @ApiProperty({ type: String, description: 'Amount applied to interest as decimal string' })
    appliedToInterest: Decimal;

    @ApiProperty({ type: String, description: 'Amount applied to late fee as decimal string' })
    appliedToLateFee: Decimal;
}
