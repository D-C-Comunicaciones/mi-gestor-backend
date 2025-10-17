import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function SwaggerGetProfileDoc() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiCookieAuth('token'),

    ApiOperation({
      summary: 'Obtener perfil del usuario autenticado',
      description:
        'Retorna la información del perfil del usuario actualmente autenticado',
    }),

    ApiOkResponse({
      description: 'Perfil del usuario obtenido exitosamente',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          email: { type: 'string', example: 'usuario@ejemplo.com' },
          name: { type: 'string', example: 'Juan Pérez' },
          phone: { type: 'string', example: '+57 300 123 4567' },
          role: { type: 'string', example: 'user' },
          isActive: { type: 'boolean', example: true },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-20T14:45:00.000Z',
          },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Token de acceso faltante, inválido o expirado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: {
            type: 'string',
            example: 'Token de acceso inválido o expirado',
          },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),

    ApiForbiddenResponse({
      description: 'Acceso prohibido - Usuario inactivo o sin permisos',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: {
            type: 'string',
            example: 'Usuario inactivo o sin permisos',
          },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: {
            type: 'string',
            example:
              'Error interno del servidor al obtener el perfil',
          },
          error: { type: 'string', example: 'Internal Server Error' },
        },
      },
    }),
  );
}
