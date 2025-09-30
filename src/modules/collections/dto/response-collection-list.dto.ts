import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class CollectorInfoDto {
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

  @ApiProperty({ example: 'Centro' })
  @Expose()
  zoneName: string;
}

class CustomerInfoDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'María García' })
  @Expose()
  name: string;

  @ApiProperty({ example: '87654321' })
  @Expose()
  documentNumber: string;
}

class LoanInfoDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1000000 })
  @Expose()
  loanAmount: number;

  @ApiProperty({ example: 500000 })
  @Expose()
  remainingBalance: number;

  @ApiProperty({ example: 'Cuotas Fijas' })
  @Expose()
  loanTypeName: string;

  @ApiProperty({ example: 'Al día' })
  @Expose()
  loanStatusName: string;
}

export class ResponseCollectionListDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 1 })
  @Expose()
  loanId: number;

  @ApiProperty({ example: '146763.32' })
  @Expose()
  amount: string;

  @ApiProperty({ example: '100000.00' })
  @Expose()
  appliedToCapital: string;

  @ApiProperty({ example: '46763.32' })
  @Expose()
  appliedToInterest: string;

  @ApiProperty({ example: '0.00' })
  @Expose()
  appliedToLateFee: string;

  @ApiProperty({ example: '0.00' })
  @Expose()
  excessAmount: string;

  @ApiProperty({ example: '2024-01-15 10:30:00' })
  @Expose()
  paymentDate: string;

  @ApiProperty({ example: false })
  @Expose()
  isFullyPaid: boolean;

  @ApiProperty({ type: CustomerInfoDto })
  @Expose()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiProperty({ type: LoanInfoDto })
  @Expose()
  @Type(() => LoanInfoDto)
  loan: LoanInfoDto;

  @ApiProperty({ type: CollectorInfoDto })
  @Expose()
  @Type(() => CollectorInfoDto)
  collector: CollectorInfoDto;
}
