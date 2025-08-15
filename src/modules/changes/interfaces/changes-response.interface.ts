import { ResponseChangeDto } from '../dto';

export interface ChangesListResponse {
  customMessage: string;
  changes: ResponseChangeDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}
