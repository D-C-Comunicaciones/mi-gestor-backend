import { ApiProperty } from '@nestjs/swagger';
import { ResponseInterestRateDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de tasas de interés
 * Define la estructura común de todas las respuestas
 */
export interface BaseInterestRateResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de tasas de interés
 * Utilizada en el endpoint GET /interest-rates
 */
export interface InterestRateListResponse extends BaseInterestRateResponse {
  /** Lista de tasas de interés disponibles */
  interestRates: ResponseInterestRateDto[];
}

/**
 * Interfaz para la respuesta de una tasa de interés individual
 * Utilizada en endpoints que retornan una sola tasa de interés
 */
export interface InterestRateResponse extends BaseInterestRateResponse {
  /** Información de la tasa de interés */
  interestRate: ResponseInterestRateDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de tasas de interés
 */
export class SwaggerInterestRateListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Tasas de interés obtenidas correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de tasas de interés disponibles en el sistema',
    type: [ResponseInterestRateDto],
    isArray: true
  })
  interestRates: ResponseInterestRateDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de tasa de interés individual
 */
export class SwaggerInterestRateResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Tasa de interés obtenida correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información de la tasa de interés',
    type: ResponseInterestRateDto
  })
  interestRate: ResponseInterestRateDto;
}

/**
 * Interfaz para metadatos de paginación de tasas de interés
 */
export interface InterestRatePaginationMeta {
  /** Número total de tasas de interés */
  total: number;
  /** Página actual */
  page: number;
  /** Última página disponible */
  lastPage: number;
  /** Límite de elementos por página */
  limit: number;
  /** Indica si hay página siguiente */
  hasNextPage: boolean;
}

/**
 * Interfaz para respuesta paginada de tasas de interés
 */
export interface PaginatedInterestRateResponse extends BaseInterestRateResponse {
  /** Lista de tasas de interés de la página actual */
  interestRates: ResponseInterestRateDto[];
  /** Metadatos de paginación */
  meta: InterestRatePaginationMeta;
}
