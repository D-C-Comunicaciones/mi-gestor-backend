export * from './collection-response.interface';
export interface CollectionListResponse {
  customMessage: string;
  collections: any[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}