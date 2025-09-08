import { ResponseLoantypeDto } from "../dto";

export interface LoanTypeListResponse {
    customMessage: string;
    loanTypes: ResponseLoantypeDto[];

}