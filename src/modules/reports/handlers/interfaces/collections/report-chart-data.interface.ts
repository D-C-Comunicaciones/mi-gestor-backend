import { CollectorActivity } from "./collector-activity.interface";
import { CollectorComparison } from "./collector-comparission.interface";
import { CollectorPerformance } from "./collector-performance.interface";

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

export type ChartDataReport = ReportsChartData;