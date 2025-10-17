import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function SwaggerLoginDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Iniciar sesión',
      description:
        'Autentica un usuario con email y contraseña, retorna tokens de acceso',
    }),

    ApiBody({
      description: 'Credenciales de login',
      examples: {
        'admin-login': {
          summary: 'Login de administrador',
          description: 'Ejemplo de login con cuenta de administrador',
          value: {
            email: 'admin@migestor.com',
            password: 'admin123456',
          },
        },
        'user-login': {
          summary: 'Login de usuario',
          description: 'Ejemplo de login con cuenta de usuario regular',
          value: {
            email: 'usuario@ejemplo.com',
            password: 'password123',
          },
        },
      },
      schema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@ejemplo.com',
            description: 'Email del usuario',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'password123',
            description: 'Contraseña del usuario',
          },
        },
      },
    }),

    ApiOkResponse({
      description: 'Login exitoso',
      schema: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token JWT de acceso',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              email: { type: 'string', example: 'usuario@ejemplo.com' },
              name: { type: 'string', example: 'Juan Pérez' },
              role: { type: 'string', example: 'user' },
            },
          },
          expiresIn: {
            type: 'number',
            example: 3600,
            description: 'Tiempo de expiración del token en segundos',
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Credenciales inválidas o datos faltantes',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'email debe ser un email válido',
              'password es requerido',
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Credenciales incorrectas',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: {
            type: 'string',
            example: 'Email o contraseña incorrectos',
          },
          error: { type: 'string', example: 'Unauthorized' },
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
              'Error interno del servidor durante el login',
          },
          error: {
            type: 'string',
            example: 'Internal Server Error',
          },
        },
      },
    }),
  );
}
