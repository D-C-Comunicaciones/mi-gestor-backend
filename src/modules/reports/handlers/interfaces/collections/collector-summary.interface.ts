export interface CollectorSummary {
  collectorId: number;
  collectorName: string;
  collectorRoute: string;
  collectorRouteId: number | string | null;
  totalAssigned: number;
  totalCollected: number;
  totalPending: number;
  performancePercentage: number;
  collectionEfficiency: number;
  installmentsAssigned: number;
  installmentsPaid: number;
  installmentsPending: number;
  paymentsRegistered: number;
  totalCollectionsMade: number;
  uniqueCustomers: number;
  uniqueLoans: number;
  averageCollectionAmount: number;
}