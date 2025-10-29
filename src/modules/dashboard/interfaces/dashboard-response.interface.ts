import { ResponseDashboardDto } from "../dto";

export interface DashboardResponse {
  customMessage: string;
  metrics: ResponseDashboardDto;
}