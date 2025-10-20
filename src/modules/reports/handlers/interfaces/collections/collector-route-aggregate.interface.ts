export interface CollectorRouteAggregate {
  collectorId: number;
  collectorName: string;
  collectorRoute: string;
  collectorRouteId: number | string | null;
  totalAssigned: number;
  totalCollected: number;
  installmentsAssigned: number;
  installmentsPaid: number;
  paymentsRegistered: number;
  totalCollectionsMade: number;
  uniqueCustomers: Set<number>;
  uniqueLoans: Set<number>;
}