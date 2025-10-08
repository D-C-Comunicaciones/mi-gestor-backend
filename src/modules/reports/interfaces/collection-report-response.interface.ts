import { ResponseCollectionReportDto } from "../dto";

export interface CollectionReportResponse {
  customMessage: string;
  collectionsReport: ResponseCollectionReportDto;
}