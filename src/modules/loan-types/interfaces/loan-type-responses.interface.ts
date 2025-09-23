import { ApiProperty } from '@nestjs/swagger';
import { ResponseLoantypeDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de tipos de crédito
 * Define la estructura común de todas las respuestas
 */
export interface BaseLoanTypeResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de tipos de crédito
 * Utilizada en el endpoint GET /loan-types
 */
export interface LoanTypeListResponse extends BaseLoanTypeResponse {
  /** Lista de tipos de crédito disponibles */
  loanTypes: ResponseLoantypeDto[];
}

/**
 * Interfaz para la respuesta de un tipo de crédito individual
 * Utilizada en endpoints que retornan un solo tipo de crédito
 */
export interface LoanTypeResponse extends BaseLoanTypeResponse {
  /** Información del tipo de crédito */
  loanType: ResponseLoantypeDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de tipos de crédito
 */
export class SwaggerLoanTypeListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Listado de tipos de crédito obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de tipos de crédito disponibles en el sistema',
    type: [ResponseLoantypeDto],
    isArray: true
  })
  loanTypes: ResponseLoantypeDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de tipo de crédito individual
 */
export class SwaggerLoanTypeResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Tipo de crédito obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del tipo de crédito',
    type: ResponseLoantypeDto
  })
  loanType: ResponseLoantypeDto;
}
