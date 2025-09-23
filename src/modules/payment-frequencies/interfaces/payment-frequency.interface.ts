import { ResponsePaymentFrequencyDto } from "../dto";

export interface PaymenFrequencyListResponse{
    customMessage: string;
    paymentFrequencies: ResponsePaymentFrequencyDto[];
}