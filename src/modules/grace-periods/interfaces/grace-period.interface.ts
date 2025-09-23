import { ResponseGracePeriodDto } from "../dto";

export interface GracePeriodListResponse {
    customMessage: string;
    gracePeriods: ResponseGracePeriodDto[]
}