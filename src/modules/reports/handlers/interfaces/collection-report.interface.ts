import { CollectorSummary } from "./collection-summary.interface";
import { Collection } from "./collection.interface";
import { Metadata } from "./metadata.interface";
import { Summary } from "./summary.interface";

export interface CollectionsReport {
  startDate: string;
  endDate: string;
  summary: Summary;
  collectorSummary: CollectorSummary[];
  collections: Collection[];
  metadata: Metadata;
}