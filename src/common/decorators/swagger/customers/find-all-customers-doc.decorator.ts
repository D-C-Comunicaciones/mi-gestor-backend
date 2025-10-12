import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiQuery } from '@nestjs/swagger';

export function SwaggerFindAllCustomersDoc() {
    return applyDecorators(
      ApiOperation({ summary: 'Listar clientes', description: 'Retorna lista paginada de clientes.' }),
      ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
      ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
      ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } }),
      ApiOkResponse({
        description: 'Listado obtenido',
        examples: {
          'success': {
            summary: 'Lista obtenida exitosamente',
            value: {
              customMessage: 'Clientes obtenidos correctamente',
              customers: [
                {
                  id: 1,
                  firstName: 'Juan',
                  lastName: 'Pérez',
                  documentNumber: '12345678',
                  email: 'juan.perez@ejemplo.com',
                  phone: '+57 300 123 4567',
                  isActive: true,
                  createdAt: '2024-01-15T10:30:00.000Z',
                  updatedAt: '2024-01-20T14:45:00.000Z'
                },
                {
                  id: 2,
                  firstName: 'María',
                  lastName: 'García',
                  documentNumber: '87654321',
                  email: 'maria.garcia@ejemplo.com',
                  phone: '+57 300 987 6543',
                  isActive: true,
                  createdAt: '2024-01-16T11:30:00.000Z',
                  updatedAt: '2024-01-21T15:45:00.000Z'
                }
              ],
              meta: {
                total: 25,
                page: 1,
                lastPage: 3,
                limit: 10,
                hasNextPage: true
              }
            }
          }
        }
      }),
      ApiNotFoundResponse({ 
        description: 'No existen registros',
        examples: {
          'no-records': {
            summary: 'No se encontraron registros',
            value: {
              customMessage: 'No existen registros',
              customers: [],
              meta: {
                total: 0,
                page: 1,
                lastPage: 0,
                limit: 10,
                hasNextPage: false
              }
            }
          }
        }
      }),
      ApiUnauthorizedResponse({ 
        description: 'No autenticado',
        examples: {
          'missing-token': {
            summary: 'Token faltante',
            value: {
              statusCode: 401,
              message: 'Token de acceso requerido',
              error: 'Unauthorized'
            }
          },
          'invalid-token': {
            summary: 'Token inválido o expirado',
            value: {
              statusCode: 401,
              message: 'Token de acceso inválido o expirado',
              error: 'Unauthorized'
            }
          }
        }
      }),
      ApiForbiddenResponse({ 
        description: 'Sin permiso view.customers',
        examples: {
          'insufficient-permissions': {
            summary: 'Sin permisos para ver clientes',
            value: {
              statusCode: 403,
              message: 'No tienes permisos para ver los clientes',
              error: 'Forbidden'
            }
          }
        }
      }),
      ApiInternalServerErrorResponse({ 
        description: 'Error interno',
        examples: {
          'server-error': {
            summary: 'Error interno del servidor',
            value: {
              statusCode: 500,
              message: 'Error interno del servidor al obtener los clientes',
              error: 'Internal Server Error'
            }
          }
        }
      })
    );
}