import { SwaggerCompanyResponse } from '@modules/companies/interfaces/company-responses.interface';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function FindOneCompanyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener empresa por ID',
      description:
        'Obtiene los detalles de la empresa por su ID. Incluye el logo en formato base64.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'Identificador único de la empresa',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Empresa encontrada correctamente',
      type: SwaggerCompanyResponse,
    }),
    ApiBadRequestResponse({
      description: 'ID inválido',
      schema: {
        example: {
          message: 'El ID debe ser un número válido',
          code: 400,
          status: 'error',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado',
      schema: {
        example: {
          message: 'Token de acceso inválido o expirado',
          code: 401,
          status: 'error',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.companies',
      schema: {
        example: {
          message: 'No tiene permisos para ver empresas',
          code: 403,
          status: 'error',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Empresa no encontrada',
      schema: {
        example: {
          message: 'Empresa con ID 999 no encontrada',
          code: 404,
          status: 'error',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
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
