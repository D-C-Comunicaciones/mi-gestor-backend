import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class OverdueCustomerDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Juan Pérez' })
  @Expose()
  name: string;

  @ApiProperty({ example: '12345678' })
  @Expose()
  documentNumber: string;

  @ApiProperty({ example: '+57 300 123 4567' })
  @Expose()
  phone: string;

  @ApiProperty({ example: 'Calle 123 #45-67' })
  @Expose()
  address: string;

  @ApiProperty({ example: 'Centro' })
  @Expose()
  zoneName: string;

  @ApiProperty({ example: 'CTR' })
  @Expose()
  zoneCode: string;
}

class OverdueInstallmentDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 3 })
  @Expose()
  sequence: number;

  @ApiProperty({ example: '2024-01-15' })
  @Expose()
  dueDate: string;

  @ApiProperty({ example: 30 })
  @Expose()
  daysLate: number;

  @ApiProperty({ example: '100000.00' })
  @Expose()
  capitalAmount: string;

  @ApiProperty({ example: '25000.00' })
  @Expose()
  interestAmount: string;

  @ApiProperty({ example: '125000.00' })
  @Expose()
  totalAmount: string;

  @ApiProperty({ example: '50000.00' })
  @Expose()
  paidAmount: string;

  @ApiProperty({ example: '75000.00' })
  @Expose()
  pendingAmount: string;

  @ApiProperty({ example: '15000.00' })
  @Expose()
  lateFeeAmount: string;

  @ApiProperty({ example: '90000.00' })
  @Expose()
  totalOwed: string;

  @ApiProperty({ example: 'En Mora' })
  @Expose()
  statusName: string;
}

export class ResponseOverdueLoanDto {
  @ApiProperty({ example: 1 })
  @Expose()
  loanId: number;

  @ApiProperty({ example: '1000000.00' })
  @Expose()
  loanAmount: string;

  @ApiProperty({ example: '500000.00' })
  @Expose()
  remainingBalance: string;

  @ApiProperty({ example: 'Cuotas Fijas' })
  @Expose()
  loanTypeName: string;

  @ApiProperty({ example: '2024-01-01' })
  @Expose()
  startDate: string;

  @ApiProperty({ example: 45 })
  @Expose()
  totalDaysLate: number;

  @ApiProperty({ example: '250000.00' })
  @Expose()
  totalAmountOwed: string;

  @ApiProperty({ type: OverdueCustomerDto })
  @Expose()
  @Type(() => OverdueCustomerDto)
  customer: OverdueCustomerDto;

  @ApiProperty({ type: [OverdueInstallmentDto] })
  @Expose()
  @Type(() => OverdueInstallmentDto)
  overdueInstallments: OverdueInstallmentDto[];
}
