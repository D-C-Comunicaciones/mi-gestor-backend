import { ResponseDiscountDto } from "../dto/response-discount.dto";

export interface DiscountListResponse {
  customMessage: string;
  discounts: ResponseDiscountDto[];
  meta: {
    totalItems: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}
