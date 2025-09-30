import { ResponseZoneDto } from '../dto';

export interface ZoneResponse {
  customMessage: string;
  zone: ResponseZoneDto;
}

export interface ZoneListResponse {
  customMessage: string;
  zones: ResponseZoneDto[];
}