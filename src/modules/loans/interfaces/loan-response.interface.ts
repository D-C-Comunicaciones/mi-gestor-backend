import { ResponseLoanDto } from "../dto";

// Respuesta single (findOne, create, delete, softDelete)
export interface LoanResponse {
    customMessage: string;
    loan: ResponseLoanDto;
}

// Respuesta listado (findAll)
export interface LoanListResponse {
    customMessage: string;
    loans: ResponseLoanDto[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        hasNextPage: boolean;
    };
}

// Registro de cambio (update) – alineado con lo que emite el servicio
export interface LoanChangeRecord {
    field: string;
    old: any;
    new: any;
}

// Respuesta update
export interface LoanUpdateResponse {
    customMessage: string;
    loan: ResponseLoanDto;
    changes: LoanChangeRecord[];
}

// Respuesta regenerar cuotas
export interface LoanRegenerateInstallmentsResponse {
    customMessage: string;
    generated: number;
}
