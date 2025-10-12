import { SwaggerCompanyListResponse } from '@modules/companies/interfaces/company-responses.interface';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';

export function FindAllCompaniesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener empresa del sistema',
      description:
        'Obtiene la información de la empresa registrada en el sistema (singleton). Incluye el logo en formato base64.',
    }),
    ApiOkResponse({
      description: 'Información de la empresa obtenida correctamente',
      type: SwaggerCompanyListResponse,
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron empresas',
      schema: {
        example: {
          message: 'No se encontraron empresas registradas',
          code: 404,
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
