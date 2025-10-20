import { CollectorActivity } from "./collector-activity.interface";
import { CollectorPerformance } from "./collector-performance.interface";
import { ReportsChartData } from "./report-chart-data.interface";

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
