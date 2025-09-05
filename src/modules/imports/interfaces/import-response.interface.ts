import { ResponseImportDto } from "../dto/response-import.dto";

export interface ImportListResponse {
    customMessage: string;
    customersImports: ResponseImportDto[];
    meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export interface ImportResponse {
    customMessage: string;
    customerImport: ResponseImportDto;
}