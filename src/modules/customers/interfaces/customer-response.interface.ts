import { ResponseCustomerDto } from '../dto';

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
