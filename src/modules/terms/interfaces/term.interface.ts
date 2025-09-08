import { ResponseTermDto } from "../dto";

export interface TermListResponse {
    customMessage: string;
    terms: ResponseTermDto[];
}