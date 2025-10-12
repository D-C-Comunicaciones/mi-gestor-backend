import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

export function SwaggerUpdateCollectorDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar cobrador',
      description: 'Actualiza los datos de un cobrador existente.',
    }),
    ApiParam({ name: 'id', required: true, example: 7 }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Cobrador actualizado' },
          phone: { type: 'string', example: '+573001234567' },
        },
      },
    }),
    ApiOkResponse({
      description: 'Cobrador actualizado correctamente.',
      schema: {
        example: {
          message: 'Cobrador actualizado correctamente',
          code: 200,
          status: 'success',
          data: {
            collector: {
              id: 7,
              firstName: 'Cobrador actualizado',
              lastName: '# 3',
              documentNumber: 345678,
              phone: '+573001234567',
              address: 'en su casa',
              updatedAt: '2025-10-11 18:07:20',
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Cobrador no encontrado.',
      schema: {
        example: {
          message: 'Cobrador no encontrado.',
          code: 404,
          status: 'error',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado.',
      schema: {
        example: {
          message: 'Acceso no autorizado.',
          code: 401,
          status: 'error',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso update.collectors.',
      schema: {
        example: {
          message: 'No tiene los permisos necesarios.',
          code: 403,
          status: 'error',
        },
      },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Error de validación.',
      schema: {
        example: {
          message: 'Los datos enviados no son válidos.',
          code: 422,
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
