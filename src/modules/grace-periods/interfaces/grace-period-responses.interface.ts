import { ApiProperty } from '@nestjs/swagger';
import { ResponseGracePeriodDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de períodos de gracia
 * Define la estructura común de todas las respuestas
 */
export interface BaseGracePeriodResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de períodos de gracia
 * Utilizada en el endpoint GET /grace-periods
 */
export interface GracePeriodListResponse extends BaseGracePeriodResponse {
  /** Lista de períodos de gracia disponibles */
  gracePeriods: ResponseGracePeriodDto[];
}

/**
 * Interfaz para la respuesta de un período de gracia individual
 * Utilizada en endpoints que retornan un solo período de gracia
 */
export interface GracePeriodResponse extends BaseGracePeriodResponse {
  /** Información del período de gracia */
  gracePeriod: ResponseGracePeriodDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de períodos de gracia
 */
export class SwaggerGracePeriodListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Períodos de gracia obtenidos correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de períodos de gracia disponibles en el sistema',
    type: [ResponseGracePeriodDto],
    isArray: true
  })
  gracePeriods: ResponseGracePeriodDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de período de gracia individual
 */
export class SwaggerGracePeriodResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Período de gracia obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del período de gracia',
    type: ResponseGracePeriodDto
  })
  gracePeriod: ResponseGracePeriodDto;
}
