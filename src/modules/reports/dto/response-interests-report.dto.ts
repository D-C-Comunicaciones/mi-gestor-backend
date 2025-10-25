import { Expose, Type } from 'class-transformer';

export class InterestPaymentRecordDto {
  @Expose() paymentId: number;
  @Expose() installmentId: number;
  @Expose() loanId: number;
  @Expose() customerId: number;
  @Expose() customerName: string;
  @Expose() customerDocument: string;
  @Expose() collectorId: number;
  @Expose() collectorName: string;
  @Expose() paymentDate: string;
  @Expose() interestCollected: number;
  @Expose() capitalCollected: number;
  @Expose() lateFeeCollected: number;
  @Expose() totalCollected: number;
}

export class CustomerInterestSummaryDto {
  @Expose() customerId: number;
  @Expose() customerName: string;
  @Expose() customerDocument: string;
  @Expose() totalInterestCollected: number;
  @Expose() totalCapitalCollected: number;
  @Expose() totalLateFeeCollected: number;
  @Expose() totalCollected: number;
  @Expose() paymentsCount: number;

  @Expose()
  @Type(() => InterestPaymentRecordDto)
  records: InterestPaymentRecordDto[];
}

export class InterestsSummaryDto {
  @Expose() totalInterestCollected: number;
  @Expose() totalCapitalCollected: number;
  @Expose() totalLateFeeCollected: number;
  @Expose() totalCollected: number;
  @Expose() totalPayments: number;
  @Expose() totalCustomers: number;
}

export class ResponseInterestReportDto {
  @Expose() generatedAt: string;
  @Expose() startDate: string;
  @Expose() endDate: string;

  @Expose()
  @Type(() => CustomerInterestSummaryDto)
  data: CustomerInterestSummaryDto[];

  @Expose()
  @Type(() => InterestsSummaryDto)
  summary: InterestsSummaryDto;
}
