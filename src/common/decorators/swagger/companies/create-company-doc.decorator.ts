import { SwaggerCompanyResponse } from '@modules/companies/interfaces/company-responses.interface';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function CreateCompanyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear empresa',
      description:
        'Crea una nueva empresa en el sistema. Todos los campos son obligatorios, excepto el logo.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Datos de la empresa a crear (multipart/form-data para incluir logo opcional)',
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nombre de la empresa',
            example: 'Mi Gestor Financiero S.A.S',
            maxLength: 150,
          },
          nit: {
            type: 'string',
            description: 'NIT de la empresa (solo números)',
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
            description: 'Número telefónico de la empresa',
            example: '+57 1 234 5678',
            maxLength: 20,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico de contacto de la empresa',
            example: 'contacto@migestorfinanciero.com',
            maxLength: 100,
          },
          address: {
            type: 'string',
            description: 'Dirección física de la empresa',
            example: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.',
            maxLength: 200,
          },
          logo: {
            type: 'string',
            format: 'binary',
            description: 'Archivo del logo de la empresa (opcional)',
            nullable: true,
          },
        },
        required: [
          'name',
          'nit',
          'verificationDigit',
          'phone',
          'email',
          'address',
        ], // 👈 todos obligatorios excepto logo
      },
    }),
    ApiCreatedResponse({
      description: 'Empresa creada exitosamente',
      type: SwaggerCompanyResponse,
    }),
    ApiBadRequestResponse({
      description: 'Datos inválidos o archivo no válido',
    }),
    ApiUnprocessableEntityResponse({
      description: 'Error de validación en los datos enviados',
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado',
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso create.companies',
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
    }),
  );
}
