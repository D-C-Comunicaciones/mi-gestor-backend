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


export function SwaggerChangesList() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar cambios realizados en modelos',
      description: 'Retorna un listado paginado de los cambios realizados en distintos modelos de la aplicación.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Número de página para la paginación',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Cantidad de registros por página',
      example: 5,
    }),
    ApiOkResponse({
      description: 'Lista de cambios obtenida correctamente',
      schema: {
        example: {
          message: 'Lista de cambios realizados en modelos',
          code: 200,
          status: 'success',
          data: {
            changes: [
              {
                id: 1510,
                model: 'Payment',
                action: 'create',
                before: null,
                after: {
                  id: 79,
                  amount: 264237,
                  loanId: 16,
                  collectorId: null,
                  paymentDate: '2025-10-08T00:00:00.000Z',
                  paymentTypeId: 1,
                  paymentMethodId: 1,
                  recordedByUserId: 1,
                },
                timestamp: '2025-10-08 16:08:34',
                userId: 1,
              },
            ],
            meta: {
              total: 79,
              page: 1,
              lastPage: 16,
              limit: 5,
              hasNextPage: true,
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Parámetros de consulta inválidos',
      schema: {
        example: {
          statusCode: 400,
          message: ['page debe ser un número', 'limit debe ser un número'],
          error: 'Bad Request',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      schema: {
        example: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Acceso prohibido',
      schema: {
        example: {
          statusCode: 403,
          message: 'No tienes permisos para acceder a los cambios',
          error: 'Forbidden',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron cambios',
      schema: {
        example: {
          statusCode: 404,
          message: 'No se encontraron cambios con los parámetros proporcionados',
          error: 'Not Found',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error al obtener la lista de cambios',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}