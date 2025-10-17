import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerFindAllDiscountsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener todos los descuentos',
      description:
        'Retorna una lista paginada con todos los descuentos del sistema. Requiere permisos de visualización.',
    }),

    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Cantidad de elementos por página',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description:
        'Término de búsqueda para filtrar descuentos por descripción',
      example: 'buen comportamiento',
    }),
    ApiQuery({
      name: 'moratoryId',
      required: false,
      type: Number,
      description: 'Filtrar por ID de moratoria específica',
      example: 1,
    }),
    ApiQuery({
      name: 'discountTypeId',
      required: false,
      type: Number,
      description: 'Filtrar por ID de tipo de descuento',
      example: 1,
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      type: Boolean,
      description: 'Filtrar por descuentos activos o inactivos',
      example: true,
    }),

    ApiOkResponse({
      description: 'Lista de descuentos obtenida exitosamente',
      examples: {
        success: {
          summary: 'Lista obtenida exitosamente',
          value: {
            customMessage: 'Listado general de descuentos',
            discounts: [
              {
                id: 1,
                amount: 88100,
                discountTypeId: 1,
                description:
                  'Descuento por buen comportamiento de pago a cuota, para que pague',
                moratoryId: 1,
                createdAt: '2024-01-15T10:30:00.000Z',
                updatedAt: '2024-01-20T14:45:00.000Z',
              },
              {
                id: 2,
                amount: 50000,
                discountTypeId: 2,
                description:
                  'Descuento promocional del mes de diciembre',
                moratoryId: 2,
                createdAt: '2024-01-16T11:30:00.000Z',
                updatedAt: '2024-01-21T15:45:00.000Z',
              },
            ],
            meta: {
              totalItems: 25,
              page: 1,
              lastPage: 3,
              limit: 10,
              hasNextPage: true,
              hasPreviousPage: false,
            },
          },
        },
      },
    }),

    ApiNotFoundResponse({
      description: 'No se encontraron descuentos',
      examples: {
        'no-records': {
          summary: 'No existen registros',
          value: {
            customMessage: 'No existen registros',
            discounts: [],
            meta: {
              totalItems: 0,
              page: 1,
              lastPage: 0,
              limit: 10,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Parámetros de consulta inválidos',
      examples: {
        'pagination-error': {
          summary: 'Parámetros de paginación inválidos',
          value: {
            statusCode: 400,
            message: [
              'page debe ser un número positivo',
              'limit debe estar entre 1 y 100',
            ],
            error: 'Bad Request',
          },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido o inválido',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
        'invalid-token': {
          summary: 'Token inválido o expirado',
          value: {
            statusCode: 401,
            message: 'Token de acceso inválido o expirado',
            error: 'Unauthorized',
          },
        },
      },
    }),

    ApiForbiddenResponse({
      description: 'Acceso prohibido - Sin permisos para ver descuentos',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para ver descuentos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para ver los descuentos',
            error: 'Forbidden',
          },
        },
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al obtener los descuentos',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}
