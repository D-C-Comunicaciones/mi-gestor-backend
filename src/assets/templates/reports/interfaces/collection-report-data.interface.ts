/**
 * Tipado de los datos del reporte
 */
export interface CollectionReportData {
  reportDate: string;
  startDate: string;
  endDate: string;
  headerLogo: string;
  watermarkLogo: string;
  verticalTextBase64: string;
  summary: {
    globalPerformancePercentage: number;
    totalAssigned: number;
    totalCollected: number;
    totalCollections: number;
    activeCollectors: number;
    averageCollectedPerCollector: number;
    bestCollector: {
      name: string;
      percentage: number;
      collected: number;
    };
    worstCollector: {
      name: string;
      percentage: number;
      collected: number;
    };
  };
  collectorSummary: Array<{
    collectorName: string;
    collectorRoute: string;
    totalAssigned: number;
    totalCollected: number;
    totalCollectionsMade: number;
    performancePercentage: number;
    averageCollectionAmount: number;
  }>;
  collections: Array<{
    paymentDate: string;
    loanId: string;
    customerName: string;
    collectorName: string;
    collectorRoute: string;
    amount: number;
  }>;
  globalPerformanceChartBase64?: string;
  comparisonChartBase64?: string;
}