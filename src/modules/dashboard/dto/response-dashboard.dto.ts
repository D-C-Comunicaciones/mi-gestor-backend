import { Expose, Type } from 'class-transformer';

export class DashboardCardDto {
  @Expose()
  totalCollected: number;

  @Expose()
  totalCustomers: number;

  @Expose()
  customersInOverdue: number;

  @Expose()
  installmentsInProgress: number;

  @Expose()
  installmentsDueSoon: number;
}

export class MonthlyCollectionDto {
  @Expose()
  startDate: string;

  @Expose()
  endDate: string;

  @Expose()
  @Type(() => DailyCollectionDto)
  daily: DailyCollectionDto[];
}

export class DailyCollectionDto {
  @Expose()
  date: string;

  @Expose()
  total: number;
}

export class ClientStatusDto {
  @Expose()
  upToDate: { count: number; percent: number };

  @Expose()
  overdue: { count: number; percent: number };

  @Expose()
  dueSoon: { count: number; percent: number };
}

export class CollectorPerformanceDto {
  @Expose()
  collectorId: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  clientsCount: number;

  @Expose()
  collected: number;

  @Expose()
  target: number;

  @Expose()
  percent: number;
}

export class PaymentDto {
  @Expose()
  paymentId: number;

  @Expose()
  paymentDate: string;

  @Expose()
  amount: number;

  @Expose()
  appliedAmount: number;

  @Expose()
  status: string;

  @Expose()
  collector: { id: number; firstName: string; lastName: string } | null;

  @Expose()
  customer: { id: number; firstName: string; lastName: string } | null;
}

export class ResponseDashboardDto {
  @Expose()
  @Type(() => DashboardCardDto)
  cards: DashboardCardDto;

  @Expose()
  @Type(() => MonthlyCollectionDto)
  monthlyCollection: MonthlyCollectionDto;

  @Expose()
  @Type(() => ClientStatusDto)
  clientStatus: ClientStatusDto;

  @Expose()
  @Type(() => CollectorPerformanceDto)
  collectorsPerformance: CollectorPerformanceDto[];

  @Expose()
  @Type(() => PaymentDto)
  recentPayments: PaymentDto[];
}
