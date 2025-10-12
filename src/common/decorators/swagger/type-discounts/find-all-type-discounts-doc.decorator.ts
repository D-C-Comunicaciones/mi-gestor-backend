import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';


export function SwaggerTypeDiscounts() {
  return applyDecorators(
    ApiOperation({ summary: 'Obtener tipos de descuentos', description: 'Retorna la lista de tipos de descuentos.' }),
    ApiOkResponse({
      description: 'Tipos de descuentos obtenidos correctamente',
      examples: {
        success: {
          summary: 'Tipos de descuentos obtenidos',
          value: {
            message: 'Lista de tipos de descuentos',
            code: 200,
            status: 'success',
            data: {
              typeDiscounts: [
                { id: 1, name: 'Descuento por pronto pago', percentage: 10 },
                { id: 2, name: 'Descuento por volumen', percentage: 15 }
              ]
            }
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        missingToken: {
          summary: 'Token faltante',
          value: {
            code: 401,
            message: 'Token de acceso requerido',
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos',
          value: {
            code: 403,
            message: 'No tiene los permisos necesarios para realizar esta acción.',
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: {
            code: 500,
            message: 'Error interno del servidor',
            status: 'error',
            errors: null
          }
        }
      }
    })
  );
}
