import { ResponseCollectorDto } from "../dto";

export interface CollectorResponse {
    customMessage: string;
    collector: ResponseCollectorDto;
}

export interface CollectorListResponse {
    customMessage: string;
    collectors: ResponseCollectorDto[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        hasNextPage: boolean;
    };
}