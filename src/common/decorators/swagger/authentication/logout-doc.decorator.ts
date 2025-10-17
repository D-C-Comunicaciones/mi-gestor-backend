import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function SwaggerLogoutDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cerrar sesión del usuario',
      description:
        'Invalida el token JWT y la sesión del usuario. Acepta token desde Authorization header o cookie.',
    }),

    ApiOkResponse({
      description: 'Sesión cerrada exitosamente',
      examples: {
        success: {
          summary: 'Sesión cerrada exitosamente',
          value: {
            customMessage: 'Sesión cerrada correctamente',
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'No se encontró token para cerrar sesión',
      examples: {
        'no-token': {
          summary: 'No se encontró token',
          value: {
            statusCode: 400,
            message:
              'No se encontró token en cookie ni en Authorization header',
            error: 'Bad Request',
          },
        },
        'no-active-session': {
          summary: 'No hay sesión activa',
          value: {
            statusCode: 400,
            message: 'No se encontró una sesión activa para cerrar',
            error: 'Bad Request',
          },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Token de acceso no válido o faltante.',
      examples: {
        'invalid-token': {
          summary: 'Token inválido',
          value: {
            statusCode: 401,
            message: 'Token no válido o expirado',
            error: 'Unauthorized',
          },
        },
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor durante el logout',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}
