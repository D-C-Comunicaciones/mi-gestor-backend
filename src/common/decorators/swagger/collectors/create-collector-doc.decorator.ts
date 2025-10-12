import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

export function SwaggerCreateCollectorDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear cobrador',
      description: 'Registra un nuevo cobrador. El avatar es opcional.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Cobrador' },
          lastName: { type: 'string', example: '# 3' },
          typeDocumentIdentificationId: { type: 'integer', example: 1 },
          documentNumber: { type: 'integer', example: 345678 },
          birthDate: { type: 'string', format: 'date', example: '2005-05-14' },
          genderId: { type: 'integer', example: 1 },
          phone: { type: 'string', example: '+573150674367' },
          address: { type: 'string', example: 'en su casa' },
          userId: { type: 'integer', example: 15 },
          avatar: { type: 'string', format: 'binary', description: 'Avatar opcional' },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Cobrador creado correctamente.',
      schema: {
        example: {
          message: 'Cobrador creado correctamente',
          code: 201,
          status: 'success',
          data: {
            collector: {
              id: 7,
              firstName: 'Cobrador',
              lastName: '# 3',
              typeDocumentIdentificationId: 1,
              documentNumber: 345678,
              birthDate: '2005-05-14',
              genderId: 1,
              phone: '+573150674367',
              address: 'en su casa',
              userId: 15,
              user: {
                id: 15,
                email: 'collector3@dcmigestor.co',
                name: 'Cobrador # 3',
              },
              createdAt: '2025-10-11 18:07:20',
              updatedAt: '2025-10-11 18:07:20',
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Datos inválidos.',
      schema: {
        example: {
          message: 'Datos inválidos o archivo no válido',
          code: 400,
          status: 'error',
        },
      },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Error de validación.',
      schema: {
        example: {
          message: 'Los datos enviados no son válidos.',
          code: 422,
          status: 'error',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado.',
      schema: {
        example: {
          message: 'Acceso no autorizado.',
          code: 401,
          status: 'error',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso create.collectors.',
      schema: {
        example: {
          message: 'No tiene los permisos necesarios.',
          code: 403,
          status: 'error',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.',
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
