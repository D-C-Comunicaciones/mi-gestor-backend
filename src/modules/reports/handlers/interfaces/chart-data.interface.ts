import { CollectorActivity } from "./collector-activity.interface";
import { CollectorComparison } from "./collector-comparison.interface";
import { CollectorPerformance } from "./collector-performance.interface";

export interface ChartData {
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