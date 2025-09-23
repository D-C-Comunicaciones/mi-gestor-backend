import { ResponseGenderDto } from "../dto";

export interface GendersListResponse {
    customMessage: string;
    genders: ResponseGenderDto[];
}