import { ResponseCollectionListDto } from '@modules/collections/dto';
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
} from '@nestjs/swagger';

export function SwaggerGetCollections() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener historial de cobros',
      description:
        'Retorna una lista paginada con todos los cobros/pagos realizados en el sistema',
    }),
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
    ApiQuery({ name: 'loanId', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'collectorId', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'startDate', required: false, schema: { type: 'string', format: 'date' } }),
    ApiQuery({ name: 'endDate', required: false, schema: { type: 'string', format: 'date' } }),
    ApiOkResponse({ description: 'Lista de cobros obtenida exitosamente', type: ResponseCollectionListDto }),
    ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos' }),
    ApiNotFoundResponse({ description: 'No se encontraron cobros' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token inválido o faltante' }),
    ApiForbiddenResponse({ description: 'Sin permisos' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor' }),
  );
}