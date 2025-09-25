import { ApiProperty } from '@nestjs/swagger';
import { ResponseCollectionDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de recaudos
 * Define la estructura común de todas las respuestas
 */
export interface BaseCollectionResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de recaudos
 * Utilizada en el endpoint GET /collections
 */
export interface CollectionListResponse extends BaseCollectionResponse {
  /** Lista de recaudos registrados */
  collections: ResponseCollectionDto[];
  /** Metadatos de paginación */
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Interfaz para la respuesta de un recaudo individual
 * Utilizada en endpoints que retornan un solo recaudo
 */
export interface CollectionResponse extends BaseCollectionResponse {
  /** Información del recaudo registrado */
  collection: ResponseCollectionDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de recaudos
 */
export class SwaggerCollectionListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Recaudos obtenidos correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de recaudos registrados en el sistema',
    type: [ResponseCollectionDto],
    isArray: true
  })
  collections: ResponseCollectionDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: 'object',
    properties: {
      total: { type: 'number', example: 150, description: 'Total de recaudos' },
      page: { type: 'number', example: 1, description: 'Página actual' },
      lastPage: { type: 'number', example: 15, description: 'Última página' },
      limit: { type: 'number', example: 10, description: 'Elementos por página' },
      hasNextPage: { type: 'boolean', example: true, description: 'Hay página siguiente' }
    }
  })
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Clase documentada para Swagger - Respuesta de recaudo individual
 */
export class SwaggerCollectionResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Recaudo registrado correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del recaudo registrado',
    type: ResponseCollectionDto
  })
  collection: ResponseCollectionDto;
}
