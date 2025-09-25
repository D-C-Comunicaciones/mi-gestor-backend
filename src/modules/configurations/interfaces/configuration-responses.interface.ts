import { ApiProperty } from '@nestjs/swagger';
import { ResponseConfigurationDto } from '../dto';

/**
 * Interfaz base para respuestas del módulo de configuraciones
 * Define la estructura común de todas las respuestas
 */
export interface BaseConfigurationResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta de configuración individual
 * Utilizada en endpoints que retornan una sola configuración
 */
export interface ConfigurationResponse extends BaseConfigurationResponse {
  /** Información de la configuración */
  configurations: ResponseConfigurationDto | ResponseConfigurationDto[];
}

/**
 * Clase documentada para Swagger - Respuesta de configuración individual
 */
export class SwaggerConfigurationResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Configuración obtenida exitosamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Configuración del sistema',
    type: ResponseConfigurationDto
  })
  configurations: ResponseConfigurationDto;
}

/**
 * Clase documentada para Swagger - Respuesta de lista de configuraciones
 */
export class SwaggerConfigurationListResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Configuraciones obtenidas exitosamente'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Lista de configuraciones del sistema',
    type: [ResponseConfigurationDto],
    isArray: true
  })
  configurations: ResponseConfigurationDto[];
}
