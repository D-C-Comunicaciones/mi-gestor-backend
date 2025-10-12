import { UpdateCustomerDto } from '@modules/customers/dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnprocessableEntityResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiParam, ApiBody } from '@nestjs/swagger';

export function SwaggerUpdateCustomerDoc() {
    return applyDecorators(
      ApiOperation({ summary: 'Actualizar cliente', description: 'Actualiza campos del cliente (solo cambios).' }),
      ApiParam({ name: 'id', type: Number, example: 1 }),
      ApiBody({ type: UpdateCustomerDto }),
      ApiOkResponse({ 
        description: 'Actualizado',
        examples: {
          'success': {
            summary: 'Cliente actualizado exitosamente',
            value: {
              customMessage: 'Cliente actualizado correctamente',
              customer: {
                id: 1,
                firstName: 'Juan Carlos',
                lastName: 'Pérez Actualizado',
                documentNumber: '12345678',
                email: 'juan.actualizado@ejemplo.com',
                phone: '+57 300 999 8888',
                isActive: true,
                updatedAt: '2024-01-20T14:45:00.000Z'
              }
            }
          }
        }
      }),
      ApiBadRequestResponse({ 
        description: 'Sin cambios / unicidad',
        examples: {
          'no-changes': {
            summary: 'No se detectaron cambios',
            value: {
              statusCode: 400,
              message: 'No se detectaron cambios.',
              error: 'Bad Request'
            }
          },
          'duplicate-email': {
            summary: 'Email ya existe',
            value: {
              statusCode: 400,
              message: 'El email ya está registrado por otro cliente.',
              error: 'Bad Request'
            }
          }
        }
      }),
      ApiNotFoundResponse({ 
        description: 'No encontrado',
        examples: {
          'customer-not-found': {
            summary: 'Cliente no encontrado',
            value: {
              statusCode: 404,
              message: 'Cliente con ID 1 no encontrado',
              error: 'Not Found'
            }
          }
        }
      }),
      ApiUnprocessableEntityResponse({ 
        description: 'Validación',
        examples: {
          'validation-error': {
            summary: 'Errores de validación',
            value: {
              statusCode: 422,
              message: [
                'email debe ser un email válido',
                'phone debe tener un formato válido'
              ],
              error: 'Unprocessable Entity'
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
        description: 'Sin permiso update.customers',
        examples: {
          'insufficient-permissions': {
            summary: 'Sin permisos para actualizar clientes',
            value: {
              statusCode: 403,
              message: 'No tienes permisos para actualizar clientes',
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
              message: 'Error interno del servidor al actualizar el cliente',
              error: 'Internal Server Error'
            }
          }
        }
      })
    );
  }