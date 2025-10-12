import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerFindAllCollectorsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar todos los cobradores',
      description: 'Obtiene una lista paginada de todos los cobradores registrados en el sistema.',
    }),
    ApiOkResponse({
      description: 'Listado de cobradores obtenido correctamente.',
      schema: {
        example: {
          message: 'Cobradores obtenidos correctamente',
          code: 200,
          status: 'success',
          data: {
            collectors: [
              {
                id: 1,
                firstName: 'fernando',
                lastName: 'torres',
                typeDocumentIdentificationId: 1,
                documentNumber: 1234567892,
                birthDate: '2005-05-14',
                genderId: 1,
                phone: '+573001234567',
                address: 'en su casa',
                userId: 5,
                user: {
                  id: 5,
                  email: 'collector1@dcmigestor.co',
                  name: 'fernando torres',
                },
                createdAt: '2025-09-23 14:30:35',
                updatedAt: '2025-09-23 14:30:35',
              },
            ],
            meta: {
              total: 1,
              page: 1,
              lastPage: 1,
              limit: 10,
              hasNextPage: false,
            },
          },
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