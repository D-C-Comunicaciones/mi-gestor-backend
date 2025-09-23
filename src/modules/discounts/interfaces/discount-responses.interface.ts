import { ApiProperty } from '@nestjs/swagger';
import { ResponseDiscountDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de descuentos
 * Define la estructura común de todas las respuestas
 */
export interface BaseDiscountResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de descuentos
 * Utilizada en el endpoint GET /discounts
 */
export interface DiscountListResponse extends BaseDiscountResponse {
  /** Lista de descuentos registrados */
  discounts: ResponseDiscountDto[];
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
 * Interfaz para la respuesta de un descuento individual
 * Utilizada en endpoints que retornan un solo descuento
 */
export interface DiscountResponse extends BaseDiscountResponse {
  /** Información del descuento */
  discount: ResponseDiscountDto;
}

/**
 * Interfaz para la aplicación de descuentos
 * Utilizada cuando se aplica un descuento a un préstamo o cuota
 */
export interface DiscountApplicationResponse extends BaseDiscountResponse {
  /** Información del descuento aplicado */
  application: {
    discountId: number;
    discountName: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    applicationDate: string;
  };
}

/**
 * Clase documentada para Swagger - Respuesta de lista de descuentos
 */
export class SwaggerDiscountListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Descuentos obtenidos correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de descuentos registrados en el sistema',
    type: [ResponseDiscountDto],
    isArray: true
  })
  discounts: ResponseDiscountDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: 'object',
    properties: {
      total: { type: 'number', example: 15, description: 'Total de descuentos' },
      page: { type: 'number', example: 1, description: 'Página actual' },
      lastPage: { type: 'number', example: 2, description: 'Última página' },
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
 * Clase documentada para Swagger - Respuesta de descuento individual
 */
export class SwaggerDiscountResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Descuento obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del descuento',
    type: ResponseDiscountDto
  })
  discount: ResponseDiscountDto;
}

/**
 * Clase documentada para Swagger - Aplicación de descuento
 */
export class SwaggerDiscountApplicationResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Descuento aplicado correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información de la aplicación del descuento',
    type: 'object',
    properties: {
      discountId: { type: 'number', example: 1 },
      discountName: { type: 'string', example: 'Descuento por pago anticipado' },
      originalAmount: { type: 'number', example: 100000 },
      discountAmount: { type: 'number', example: 5000 },
      finalAmount: { type: 'number', example: 95000 },
      applicationDate: { type: 'string', format: 'date-time', example: '2025-01-04T15:30:00.000Z' }
    }
  })
  application: {
    discountId: number;
    discountName: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    applicationDate: string;
  };
}
