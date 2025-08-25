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

