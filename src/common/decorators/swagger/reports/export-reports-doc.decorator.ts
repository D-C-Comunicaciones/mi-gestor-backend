
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';


export function SwaggerExportReport(options: { reportTypes: string[], formats: string[] }) {
  return applyDecorators(
    ApiOperation({
      summary: 'Exportar reporte',
      description: 'Genera y descarga un reporte dinámicamente según el tipo y formato solicitados.'
    }),
    ApiParam({
      name: 'reportType',
      enum: options.reportTypes,
      description: 'Tipo de reporte a exportar',
      example: options.reportTypes[0]
    }),
    ApiParam({
      name: 'format',
      enum: options.formats,
      description: 'Formato de archivo deseado',
      example: options.formats[0]
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-01-01',
      description: 'Fecha de inicio (YYYY-MM-DD)'
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-12-31',
      description: 'Fecha de fin (YYYY-MM-DD)'
    }),
    ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'),
    ApiOkResponse({
      description: 'Archivo exportado exitosamente',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
        'application/pdf': { schema: { type: 'string', format: 'binary' } },
      }
    }),
    ApiBadRequestResponse({ description: 'Parámetros inválidos' }),
    ApiNotFoundResponse({ description: 'No se encontraron datos para exportar' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token requerido o inválido' }),
    ApiForbiddenResponse({ description: 'Sin permisos para exportar' }),
    ApiInternalServerErrorResponse({ description: 'Error interno al generar el archivo' }),
  );
}