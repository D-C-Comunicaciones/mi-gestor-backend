import { SwaggerCompanyResponse } from '@modules/companies/interfaces/company-responses.interface';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function UpdateCompanyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar empresa',
      description:
        'Actualiza los datos de una empresa existente. Solo se actualizan los campos enviados en la solicitud. Todos los campos son opcionales.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID de la empresa a actualizar',
      example: 1,
    }),
    ApiBody({
      description: 'Datos opcionales para actualizar la empresa',
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nombre de la empresa',
            example: 'Mi Gestor Financiero Actualizado S.A.S',
            maxLength: 150,
          },
          nit: {
            type: 'string',
            description: 'NIT de la empresa',
            example: '900123456',
            maxLength: 15,
          },
          verificationDigit: {
            type: 'string',
            description: 'Dígito de verificación del NIT',
            example: '7',
            maxLength: 1,
          },
          phone: {
            type: 'string',
            description: 'Teléfono de la empresa',
            example: '+57 1 987 6543',
            maxLength: 20,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico de la empresa',
            example: 'nuevo@migestorfinanciero.com',
            maxLength: 100,
          },
          address: {
            type: 'string',
            description: 'Dirección física de la empresa',
            example: 'Carrera 15 #93-40, Torre Empresarial, Piso 12',
            maxLength: 200,
          },
          logo: {
            type: 'string',
            format: 'binary',
            nullable: true,
            description: 'Archivo del logo de la empresa (opcional)',
          },
        },
        required: [], // 👈 Ninguno es obligatorio en un update
      },
    }),
    ApiOkResponse({
      description: 'Empresa actualizada exitosamente',
      type: SwaggerCompanyResponse,
    }),
    ApiUnauthorizedResponse({ description: 'Usuario no autenticado' }),
    ApiForbiddenResponse({ description: 'Sin permiso update.companies' }),
    ApiNotFoundResponse({ description: 'Empresa no encontrada' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor' }),
  );
}
