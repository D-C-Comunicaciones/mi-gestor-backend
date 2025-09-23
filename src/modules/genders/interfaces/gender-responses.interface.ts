import { ApiProperty } from '@nestjs/swagger';
import { ResponseGenderDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de géneros
 * Define la estructura común de todas las respuestas
 */
export interface BaseGenderResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de lista de géneros
 * Utilizada en el endpoint GET /genders
 */
export interface GenderListResponse extends BaseGenderResponse {
  /** Lista de géneros registrados */
  genders: ResponseGenderDto[];
}

/**
 * Interfaz para la respuesta de un género individual
 * Utilizada en endpoints que retornan un solo género
 */
export interface GenderResponse extends BaseGenderResponse {
  /** Información del género */
  gender: ResponseGenderDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de géneros
 */
export class SwaggerGenderListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Géneros obtenidos correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de géneros registrados en el sistema',
    type: [ResponseGenderDto],
    isArray: true
  })
  genders: ResponseGenderDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de género individual
 */
export class SwaggerGenderResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Género obtenido correctamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Información del género',
    type: ResponseGenderDto
  })
  gender: ResponseGenderDto;
}
