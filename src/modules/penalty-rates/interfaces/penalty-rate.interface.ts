import { ResponsePenaltyRateDto } from "../dto";

export interface PenaltyRateListResponse {
    customMessage: string;
    penaltyRates: ResponsePenaltyRateDto[];
}