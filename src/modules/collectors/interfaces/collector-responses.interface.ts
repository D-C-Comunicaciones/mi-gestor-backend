import { ApiProperty } from '@nestjs/swagger';
import { ResponseCollectorDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de cobradores
 * Define la estructura común de todas las respuestas
 */
export interface BaseCollectorResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de cobradores
 * Utilizada en el endpoint GET /collectors
 */
export interface CollectorListResponse extends BaseCollectorResponse {
  /** Lista de cobradores registrados */
  collectors: ResponseCollectorDto[];
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
 * Interfaz para la respuesta de un cobrador individual
 * Utilizada en endpoints que retornan un solo cobrador
 */
export interface CollectorResponse extends BaseCollectorResponse {
  /** Información del cobrador */
  collector: ResponseCollectorDto;
}

/**
 * Interfaz para estadísticas de cobradores
 * Utilizada en dashboards y reportes gerenciales
 */
export interface CollectorStatsResponse extends BaseCollectorResponse {
  /** Estadísticas de cobradores */
  stats: {
    totalCollectors: number;
    activeCollectors: number;
    inactiveCollectors: number;
    collectorsWithZone: number;
    collectorsWithoutZone: number;
    avgMonthlyGoal: number;
    avgCommissionRate: number;
    topPerformers: Array<{
      id: number;
      name: string;
      zone: string;
      totalCollections: number;
      monthlyGoal: number;
      achievementRate: number;
    }>;
  };
}

/**
 * Clase documentada para Swagger - Respuesta de lista de cobradores
 */
export class SwaggerCollectorListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Cobradores obtenidos correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de cobradores registrados en el sistema',
    type: [ResponseCollectorDto],
    isArray: true
  })
  collectors: ResponseCollectorDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: 'object',
    properties: {
      total: { type: 'number', example: 25, description: 'Total de cobradores' },
      page: { type: 'number', example: 1, description: 'Página actual' },
      lastPage: { type: 'number', example: 3, description: 'Última página' },
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
 * Clase documentada para Swagger - Respuesta de cobrador individual
 */
export class SwaggerCollectorResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Cobrador obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del cobrador',
    type: ResponseCollectorDto
  })
  collector: ResponseCollectorDto;
}

/**
 * Clase documentada para Swagger - Estadísticas de cobradores
 */
export class SwaggerCollectorStatsResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Estadísticas de cobradores obtenidas correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Estadísticas detalladas de cobradores',
    type: 'object',
    properties: {
      totalCollectors: { type: 'number', example: 25, description: 'Total de cobradores' },
      activeCollectors: { type: 'number', example: 22, description: 'Cobradores activos' },
      inactiveCollectors: { type: 'number', example: 3, description: 'Cobradores inactivos' },
      collectorsWithZone: { type: 'number', example: 20, description: 'Cobradores con zona asignada' },
      collectorsWithoutZone: { type: 'number', example: 5, description: 'Cobradores sin zona' },
      avgMonthlyGoal: { type: 'number', example: 4500000, description: 'Meta mensual promedio' },
      avgCommissionRate: { type: 'number', example: 2.8, description: 'Comisión promedio' },
      topPerformers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 5 },
            name: { type: 'string', example: 'María Elena Rodríguez' },
            zone: { type: 'string', example: 'Norte - Sector 1' },
            totalCollections: { type: 'number', example: 5200000 },
            monthlyGoal: { type: 'number', example: 5000000 },
            achievementRate: { type: 'number', example: 104.0 }
          }
        }
      }
    }
  })
  stats: any;
}
