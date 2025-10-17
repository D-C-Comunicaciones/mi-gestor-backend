// Tipos e interfaces para CollectionsReportHandler

export interface PaymentRawRow {
  paymentid?: number;
  paymentId?: number;
  amount?: string | number | null;
  paymentTypeId?: number | null;
  paymentMethodId?: number | null;
  recordedByUserId?: number | null;
  installmentId?: number | null;
  collectornname?: string | null;
  collectorName?: string | null;
  collectorid?: number | null;
  collectorId?: number | null;
  collectordocument?: string | null;
  collectorDocument?: string | null;
  collectorphone?: string | null;
  collectorPhone?: string | null;
  collectorroute?: string | null;
  collectorRoute?: string | null;
  collectorrouteid?: number | null;
  collectorRouteId?: number | null;
  loanid?: number | null;
  loanId?: number | null;
  paymentdate?: string | Date | null;
  paymentDate?: string | Date | null;
  customerid?: number | null;
  customerId?: number | null;
  customername?: string | null;
  customerName?: string | null;
  customerdocument?: string | null;
  customerDocument?: string | null;
  zonecustomerid?: number | null;
  zoneCustomerId?: number | null;
  zonecustomername?: string | null;
  zoneCustomerName?: string | null;
  zonecustomercode?: string | null;
  zoneCustomerCode?: string | null;
  customerroute?: string | null;
  customerRoute?: string | null;
  duedate?: string | Date | null;
  dueDate?: string | Date | null;
  ispaid?: boolean | null;
  isPaid?: boolean | null;
  totalamount?: string | number | null;
  totalAmount?: string | number | null;
  paidamount?: string | number | null;
  paidAmount?: string | number | null;
  paidat?: string | Date | null;
  paidAt?: string | Date | null;
  statusid?: number | null;
  statusId?: number | null;
  installmentsequence?: number | null;
  installmentSequence?: number | null;
  // plus any other DB column aliases
  [key: string]: unknown;
}

export interface InstallmentRawRow {
  installmentId?: number | null;
  loanId?: number | null;
  dueDate?: string | Date | null;
  totalAmount?: string | number | null;
  paidAmount?: string | number | null;
  isPaid?: boolean | null;
  statusId?: number | null;
  sequence?: number | null;
  collectorId?: number | null;
  collectorName?: string | null;
  collectorRoute?: string | null;
  collectorRouteId?: number | null;
  customerRoute?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  [key: string]: unknown;
}

export interface Collection {
  paymentId: number;
  paymentDate: string;
  amount: number;
  paymentTypeId: number;
  paymentMethodId: number;
  recordedByUserId: number;
  installmentId: number;
  collectorName: string;
  collectorId: number;
  collectorDocument: string;
  collectorPhone: string;
  collectorRoute: string;
  collectorRouteId: number | string | null;
  customerRoute: string;
  loanId: number;
  customerId: number;
  customerName: string;
  customerDocument: string;
  zoneCustomerId: number | null;
  zoneCustomerName: string;
  zoneCustomerCode: string;
  installmentDueDate: string | null;
  installmentIsPaid: boolean;
  installmentTotalAmount: number;
  installmentPaidAmount: number;
  installmentPaidAt: string | null;
  installmentStatusId: number | null;
  installmentSequence: number | null;
}

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

export interface CollectorPerformance {
  name: string;
  percentage: number;
  collected: number;
  assigned: number;
  route: string;
  totalCollectionsMade: number;
}

export interface CollectorComparison {
  name: string;
  collected: number;
  assigned: number;
  pending: number;
  percentage: number;
  totalCollectionsMade: number;
}

export interface CollectorActivity {
  name: string;
  totalCollectionsMade: number;
  collected: number;
  percentage: number;
  route: string;
}

// Cambiado: evitar colisión con Chart.js => ReportsChartData
export interface ReportsChartData {
  collectorPerformance: CollectorPerformance[];
  collectorComparison: CollectorComparison[];
  collectorActivity: CollectorActivity[];
  globalStats: {
    assigned: number;
    collected: number;
    pending: number;
    percentage: number;
  };
}

// Alias seguro (no exportar 'ChartData' para evitar colisión global)
export type ChartDataReport = ReportsChartData;

export interface Summary {
  totalCollections: number;
  totalAssigned: number;
  totalCollected: number;
  totalPending: number;
  globalPerformancePercentage: number;
  activeCollectors: number;
  uniqueCustomers: number;
  uniqueLoans: number;
  totalInstallmentsInPeriod: number;
  totalInstallmentsPaid: number;
  totalInstallmentsPending: number;
  averageCollectedPerCollector: number;
  averageCollectionAmount: number;
  bestPerformanceCollector: CollectorPerformance | {
    name: string;
    percentage: number;
    collected: number;
    assigned?: number;
    totalCollectionsMade?: number;
    route?: string;
  };
  worstPerformanceCollector: CollectorPerformance | {
    name: string;
    percentage: number;
    collected: number;
    assigned?: number;
    totalCollectionsMade?: number;
    route?: string;
  };
  mostActiveCollector: CollectorActivity;
  leastActiveCollector: CollectorActivity;
  bestCollector: { name: string; percentage: number; collected: number; route: string };
  worstCollector: { name: string; percentage: number; collected: number; route: string };
  // Cambiado: usar ReportsChartData para evitar ambigüedad con Chart.js
  chartData: ReportsChartData;
}

export interface Metadata {
  totalRecords: number;
  generatedAt: string;
  period: string;
  totalCollectors: number;
  activeCollectors: number;
  totalRouteAssignments?: number;
}

export interface CollectionsReport {
  startDate: string;
  endDate: string;
  summary: Summary;
  collectorSummary: CollectorSummary[];
  collections: Collection[];
  metadata: Metadata;
}
