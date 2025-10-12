import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';

export function SwaggerCreateManyCustomersDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear clientes en lote',
      description: 'Carga masiva de clientes desde un archivo Excel (.xlsx) o CSV (.csv).',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Archivo de clientes a importar. Debe ser .xlsx o .csv.',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Archivo Excel (.xlsx) o CSV (.csv) con los datos de los clientes',
          },
        },
        required: ['file'],
      },
    }),
    ApiCreatedResponse({
      description: 'Clientes creados exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Clientes creados correctamente' },
          code: { type: 'number', example: 201 },
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 11 },
                    firstName: { type: 'string', example: 'Fernando' },
                    lastName: { type: 'string', example: 'Torres' },
                    email: { type: 'string', example: 'fernandotorres@gmail.com' },
                    typeDocumentIdentificationId: { type: 'number', example: 1 },
                    typeDocumentIdentificationName: { type: 'string', example: 'Cédula de Ciudadanía' },
                    typeDocumentIdentificationCode: { type: 'string', example: 'CC' },
                    documentNumber: { type: 'number', example: 102050306 },
                    birthDate: { type: 'string', example: '1970-01-01' },
                    genderId: { type: 'number', example: 1 },
                    genderName: { type: 'string', example: 'Masculino' },
                    zoneId: { type: 'number', example: 1 },
                    zoneName: { type: 'string', example: 'Norte' },
                    zoneCode: { type: 'string', example: 'NRT' },
                    createdAt: { type: 'string', example: '2025-10-12' },
                    updatedAt: { type: 'string', example: '2025-10-12' }
                  }
                }
              },
              firstCreated: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 11 },
                  firstName: { type: 'string', example: 'Fernando' },
                  lastName: { type: 'string', example: 'Torres' },
                  email: { type: 'string', example: 'fernandotorres@gmail.com' },
                  typeDocumentIdentificationId: { type: 'number', example: 1 },
                  typeDocumentIdentificationName: { type: 'string', example: 'Cédula de Ciudadanía' },
                  typeDocumentIdentificationCode: { type: 'string', example: 'CC' },
                  documentNumber: { type: 'number', example: 102050306 },
                  birthDate: { type: 'string', example: '1970-01-01' },
                  genderId: { type: 'number', example: 1 },
                  genderName: { type: 'string', example: 'Masculino' },
                  zoneId: { type: 'number', example: 1 },
                  zoneName: { type: 'string', example: 'Norte' },
                  zoneCode: { type: 'string', example: 'NRT' },
                  createdAt: { type: 'string', example: '2025-10-12' },
                  updatedAt: { type: 'string', example: '2025-10-12' }
                }
              },
              lastCreated: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 12 },
                  firstName: { type: 'string', example: 'Alejandro David' },
                  lastName: { type: 'string', example: 'Trespalacios Muñoz' },
                  email: { type: 'string', example: 'alejandrotrespalacio@gmail.com' },
                  typeDocumentIdentificationId: { type: 'number', example: 1 },
                  typeDocumentIdentificationName: { type: 'string', example: 'Cédula de Ciudadanía' },
                  typeDocumentIdentificationCode: { type: 'string', example: 'CC' },
                  documentNumber: { type: 'number', example: 20305060 },
                  birthDate: { type: 'string', example: '1970-01-01' },
                  genderId: { type: 'number', example: 1 },
                  genderName: { type: 'string', example: 'Masculino' },
                  zoneId: { type: 'number', example: 1 },
                  zoneName: { type: 'string', example: 'Norte' },
                  zoneCode: { type: 'string', example: 'NRT' },
                  createdAt: { type: 'string', example: '2025-10-12' },
                  updatedAt: { type: 'string', example: '2025-10-12' }
                }
              },
              totalCreated: { type: 'number', example: 2 },
              totalErrors: { type: 'number', example: 0 },
              importHistoryId: { type: 'number', example: 5 }
            }
          }
        }
      },
      examples: {
        'success': {
          summary: 'Clientes creados exitosamente',
          value: {
            message: 'Clientes creados correctamente',
            code: 201,
            status: 'success',
            data: {
              results: [
                {
                  id: 11,
                  firstName: 'Fernando',
                  lastName: 'Torres',
                  email: 'fernandotorres@gmail.com',
                  typeDocumentIdentificationId: 1,
                  typeDocumentIdentificationName: 'Cédula de Ciudadanía',
                  typeDocumentIdentificationCode: 'CC',
                  documentNumber: 102050306,
                  birthDate: '1970-01-01',
                  genderId: 1,
                  genderName: 'Masculino',
                  zoneId: 1,
                  zoneName: 'Norte',
                  zoneCode: 'NRT',
                  createdAt: '2025-10-12',
                  updatedAt: '2025-10-12'
                }
              ],
              firstCreated: {
                id: 11,
                firstName: 'Fernando',
                lastName: 'Torres',
                email: 'fernandotorres@gmail.com',
                typeDocumentIdentificationId: 1,
                typeDocumentIdentificationName: 'Cédula de Ciudadanía',
                typeDocumentIdentificationCode: 'CC',
                documentNumber: 102050306,
                birthDate: '1970-01-01',
                genderId: 1,
                genderName: 'Masculino',
                zoneId: 1,
                zoneName: 'Norte',
                zoneCode: 'NRT',
                createdAt: '2025-10-12',
                updatedAt: '2025-10-12'
              },
              lastCreated: {
                id: 12,
                firstName: 'Alejandro David',
                lastName: 'Trespalacios Muñoz',
                email: 'alejandrotrespalacio@gmail.com',
                typeDocumentIdentificationId: 1,
                typeDocumentIdentificationName: 'Cédula de Ciudadanía',
                typeDocumentIdentificationCode: 'CC',
                documentNumber: 20305060,
                birthDate: '1970-01-01',
                genderId: 1,
                genderName: 'Masculino',
                zoneId: 1,
                zoneName: 'Norte',
                zoneCode: 'NRT',
                createdAt: '2025-10-12',
                updatedAt: '2025-10-12'
              },
              totalCreated: 2,
              totalErrors: 0,
              importHistoryId: 5
            }
          }
        }
      }
    }),
    ApiBadRequestResponse({
      description: 'Errores en el archivo o validación de datos',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'No se pudo crear ningún cliente debido a errores en el archivo.' },
          code: { type: 'number', example: 400 },
          status: { type: 'string', example: 'error' },
          data: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: { type: 'object' },
                example: []
              },
              totalCreated: { type: 'number', example: 0 },
              totalErrors: { type: 'number', example: 2 },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    row: { type: 'number', example: 2 },
                    field: { type: 'string', example: 'Número de documento' },
                    value: { type: 'number', example: 102050306 },
                    message: { type: 'string', example: 'El número de documento ya está registrado.' },
                    type: { type: 'string', example: 'duplicate_document' }
                  }
                }
              },
              importHistoryId: { type: 'number', example: 4 }
            }
          }
        }
      },
      examples: {
        'duplicate-documents': {
          summary: 'Documentos duplicados encontrados',
          value: {
            message: 'No se pudo crear ningún cliente debido a errores en el archivo.',
            code: 400,
            status: 'error',
            data: {
              results: [],
              totalCreated: 0,
              totalErrors: 2,
              errors: [
                {
                  row: 2,
                  field: 'Número de documento',
                  value: 102050306,
                  message: 'El número de documento ya está registrado.',
                  type: 'duplicate_document'
                },
                {
                  row: 3,
                  field: 'Número de documento',
                  value: 20305060,
                  message: 'El número de documento ya está registrado.',
                  type: 'duplicate_document'
                }
              ],
              importHistoryId: 4
            }
          }
        },
        'invalid-file': {
          summary: 'Archivo inválido',
          value: {
            message: 'El archivo debe ser un Excel (.xlsx) o CSV (.csv)',
            code: 400,
            status: 'error'
          }
        },
        'empty-file': {
          summary: 'Archivo vacío',
          value: {
            message: 'El archivo está vacío o no contiene datos válidos',
            code: 400,
            status: 'error'
          }
        }
      }
    }),
    ApiUnprocessableEntityResponse({
      description: 'Errores de validación en los datos del archivo',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Los datos enviados no son válidos. Por favor, revise la información e intente nuevamente.' },
          code: { type: 'number', example: 422 },
          status: { type: 'string', example: 'error' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'El formato de fecha debe ser YYYY-MM-DD',
              'El email debe ser válido',
              'El número de documento es requerido'
            ]
          }
        }
      },
      examples: {
        'validation-errors': {
          summary: 'Errores de validación múltiples',
          value: {
            message: 'Los datos enviados no son válidos. Por favor, revise la información e intente nuevamente.',
            code: 422,
            status: 'error',
            errors: [
              'El formato de fecha debe ser YYYY-MM-DD',
              'El email debe ser válido',
              'El número de documento es requerido'
            ]
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Acceso no autorizado. Por favor, inicie sesión para continuar.' },
          code: { type: 'number', example: 401 },
          status: { type: 'string', example: 'error' }
        }
      },
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            message: 'Acceso no autorizado. Por favor, inicie sesión para continuar.',
            code: 401,
            status: 'error'
          }
        },
        'expired-token': {
          summary: 'Token expirado',
          value: {
            message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
            code: 401,
            status: 'error'
          }
        },
        'invalid-token': {
          summary: 'Token inválido',
          value: {
            message: 'Token de autenticación inválido. Por favor, inicie sesión nuevamente.',
            code: 401,
            status: 'error'
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos suficientes',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'No tiene los permisos necesarios para realizar esta acción.' },
          code: { type: 'number', example: 403 },
          status: { type: 'string', example: 'error' }
        }
      },
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos create.customers',
          value: {
            message: 'No tiene los permisos necesarios para realizar esta acción.',
            code: 403,
            status: 'error'
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Error interno del servidor al procesar el archivo' },
          code: { type: 'number', example: 500 },
          status: { type: 'string', example: 'error' }
        }
      },
      examples: {
        'server-error': {
          summary: 'Error interno',
          value: {
            message: 'Error interno del servidor al procesar el archivo',
            code: 500,
            status: 'error'
          }
        },
        'database-error': {
          summary: 'Error de base de datos',
          value: {
            message: 'Error en base de datos',
            code: 500,
            status: 'error'
          }
        }
      }
    })
  );
}