import { MoratoryInterestDetail } from "./moratory-interest-detail.interface";

export interface MoratoryInterestReport {
  generatedAt: string;
  detailedData: MoratoryInterestDetail[];
  summary: MoratoryInterestDetail[];
}