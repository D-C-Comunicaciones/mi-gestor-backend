import { ResponseCompanyDto } from "../dto";

export interface CompanyResponse{
    customMessage: string;
    company: ResponseCompanyDto;
}