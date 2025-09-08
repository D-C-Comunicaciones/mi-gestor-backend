import { ResponseTypeDocumentIdentificationDto } from "../dto";

export interface TypeDocumentIdentificationListResponse {
    customMessage: string;
    typeDocumentIdentifications: ResponseTypeDocumentIdentificationDto[];
}