import { ResponseLoanDto } from '@modules/loans/dto';
import { ResponseCustomerDto } from '../dto';
import { UserResponseDto } from '@modules/users/dto';

export interface CustomerListResponse {
  customMessage: string;
  customers: ResponseCustomerDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export interface CustomerResponse {
  customMessage: string;
  customer: ResponseCustomerDto;
}

export interface CustomerDetailResponse {
  customMessage: string;
  customer: ResponseCustomerDto;
  loans: ResponseLoanDto[];
  user: UserResponseDto | null;
}

export interface CustomersBulkResponse {
  customMessage: string; // "Clientes creados correctamente"
    firstCreated: ResponseCustomerDto | null; // Primer cliente creado (o null si ninguno)
    lastCreated: ResponseCustomerDto | null;  // Último cliente creado (o null si ninguno)
    totalCreated: number;                     // Nº de clientes creados correctamente
    totalErrors: number;                      // Nº de errores
    errors?: BulkError[];                     // Errores de validación / creación
}

export interface BulkError {
  row: number;         // Fila del archivo donde ocurrió el error
  field?: string;      // Campo que falló ("Correo", "Número de documento"...
  value?: string | number; // Valor problemático
  message: string;     // Mensaje de error
  type?: 'duplicate_document' | 'duplicate_email' | 'validation_error'; // Categoría de error
}
