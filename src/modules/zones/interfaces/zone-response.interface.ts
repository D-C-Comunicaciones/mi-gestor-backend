import { ResponseZoneDto } from "../dto";

export interface ZoneListResponse {
  customMessage: string;
  zones: ResponseZoneDto[];
}