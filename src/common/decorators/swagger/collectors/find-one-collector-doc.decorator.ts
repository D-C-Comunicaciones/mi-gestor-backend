import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerFindOneCollectorDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener un cobrador por ID',
      description: 'Devuelve la información detallada de un cobrador específico.',
    }),
    ApiOkResponse({
      description: 'Cobrador obtenido correctamente.',
      schema: {
        example: {
          message: 'Cobrador obtenido correctamente',
          code: 200,
          status: 'success',
          data: {
            collector: {
              id: 3,
              firstName: 'Alfredo',
              lastName: 'Moreno',
              typeDocumentIdentificationId: 1,
              documentNumber: 1234567891,
              birthDate: '2005-05-14',
              genderId: 1,
              phone: '+573150674367',
              address: 'en su casa',
              userId: 6,
              user: {
                id: 6,
                email: 'collector2@dcmigestor.co',
                name: 'Alfredo Moreno',
              },
              createdAt: '2025-09-23 14:30:35',
              updatedAt: '2025-09-23 14:30:35',
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Cobrador no encontrado.',
      schema: {
        example: {
          message: 'Cobrador no encontrado',
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
