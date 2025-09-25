import { ApiProperty } from '@nestjs/swagger';
import { ResponseCompanyDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de empresas
 * Define la estructura común de todas las respuestas
 */
export interface BaseCompanyResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de empresas
 * Utilizada en el endpoint GET /companies
 */
export interface CompanyListResponse extends BaseCompanyResponse {
  /** Lista de empresas registradas */
  companies: ResponseCompanyDto[];
}

/**
 * Interfaz para la respuesta de una empresa individual
 * Utilizada en endpoints que retornan una sola empresa
 */
export interface CompanyResponse extends BaseCompanyResponse {
  /** Información de la empresa */
  company: ResponseCompanyDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de empresas
 */
export class SwaggerCompanyListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Listado de empresas'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de empresas registradas en el sistema',
    type: [ResponseCompanyDto],
    isArray: true
  })
  companies: ResponseCompanyDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de empresa individual
 */
export class SwaggerCompanyResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Detalle de la empresa'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información de la empresa',
    type: ResponseCompanyDto
  })
  company: ResponseCompanyDto;
}
