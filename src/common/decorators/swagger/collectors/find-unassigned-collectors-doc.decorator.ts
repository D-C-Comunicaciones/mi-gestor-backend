import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerFindUnassignedCollectorsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar cobradores sin rutas asignadas',
      description: 'Devuelve una lista de cobradores activos que no tienen ninguna ruta asignada.',
    }),
    ApiOkResponse({
      description: 'Listado de cobradores sin rutas obtenido correctamente.',
      schema: {
        example: {
          message: 'Cobradores sin rutas asignadas obtenidos correctamente.',
          code: 200,
          status: 'success',
          data: {
            collectors: [],
            meta: {
              total: 0,
              page: 1,
              lastPage: 1,
              limit: 10,
              hasNextPage: false,
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron cobradores sin rutas asignadas.',
      schema: {
        example: {
          message: 'No se encontraron cobradores sin rutas asignadas.',
          code: 404,
          status: 'error',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado.',
      schema: {
        example: {
          message: 'Acceso no autorizado. Por favor, inicie sesión para continuar.',
          code: 401,
          status: 'error',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.collectors.',
      schema: {
        example: {
          message: 'No tiene los permisos necesarios para realizar esta acción.',
          code: 403,
          status: 'error',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.',
      schema: {
        example: {
          message: 'Error interno del servidor',
          code: 500,
          status: 'error',
        },
      },
    }),
  );
}
