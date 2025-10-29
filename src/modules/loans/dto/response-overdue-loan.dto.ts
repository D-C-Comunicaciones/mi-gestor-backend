import { ApiProperty } from '@nestjs/swagger';
import { OverdueLoan } from '../interfaces/overdue-loan.interface';
import { Expose, Type } from 'class-transformer';

class ResponseInstallmentDto {
  @ApiProperty() @Expose() installmentId: number;
  @ApiProperty() @Expose() sequence: number;
  @ApiProperty() @Expose() dueDate: string;
  @ApiProperty() @Expose() capitalAmount: string;
  @ApiProperty() @Expose() interestAmount: string;
  @ApiProperty() @Expose() totalAmount: string;
  @ApiProperty() @Expose() paidAmount: string;
  @ApiProperty() @Expose() isPaid: boolean;
  @ApiProperty() @Expose() moratoryAmount: string;
  @ApiProperty() @Expose() daysLate: number;
}

export class ResponseOverdueLoanDto implements OverdueLoan {
  @ApiProperty() @Expose() loanId: number;
  @ApiProperty() @Expose() loanAmount: string;
  @ApiProperty() @Expose() remainingBalance: string;
  @ApiProperty() @Expose() loanTypeName: string;
  @ApiProperty() @Expose() loanStatusName: string;
  @ApiProperty() @Expose() startDate: string;

  @ApiProperty({
    type: () => Object,
    description: 'Datos del cliente',
  })
  @Expose()
  customer: OverdueLoan['customer'];

  @ApiProperty({ type: [ResponseInstallmentDto] })
  @Expose()
  @Type(() => ResponseInstallmentDto)
  installments: ResponseInstallmentDto[];

  @ApiProperty() @Expose() totalMoratoryAmount: string;
  @ApiProperty() @Expose() totalDaysLate: number;
  @ApiProperty() @Expose() totalAmountOwed: string;
}
