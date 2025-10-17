import { ChartData } from "chart.js";
import { CollectorActivity } from "./collector-activity.interface";
import { CollectorPerformance } from "./collector-performance.interface";

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
  bestPerformanceCollector: CollectorPerformance;
  worstPerformanceCollector: CollectorPerformance;
  mostActiveCollector: CollectorActivity;
  leastActiveCollector: CollectorActivity;
  bestCollector: { name: string; percentage: number; collected: number; route: string };
  worstCollector: { name: string; percentage: number; collected: number; route: string };
  chartData: ChartData;
}