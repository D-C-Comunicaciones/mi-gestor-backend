import { ResponseInterestRateDto } from "../dto";

export interface InterestRateListResponse {
    customMessage: string;
    interestRates: ResponseInterestRateDto[];
}