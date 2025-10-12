// swagger-create-customer.decorator.ts
import { CreateCustomerDto } from '@modules/customers/dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiUnprocessableEntityResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiBody } from '@nestjs/swagger';

export function SwaggerCreateCustomerDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Crear cliente', description: 'Crea un cliente y su usuario.' }),
    ApiBody({
      type: CreateCustomerDto,
      description: 'Datos del cliente a crear',
      examples: {
        'cliente-basico': {
          summary: 'Cliente básico',
          description: 'Ejemplo de cliente con información completa',
          value: {
            firstName: 'Juan',
            lastName: 'Pérez',
            typeDocumentIdentificationId: 1,
            documentNumber: 1234567890000,
            birthDate: '2005-05-15',
            genderId: 1,
            phone: '+573001234567',
            email: 'cobrador1@migestor.com',
            address: 'test etes',
            zoneId: 2
          }
        },
        'cliente-completo': {
          summary: 'Cliente completo',
          description: 'Ejemplo de cliente con otra zona y datos diferentes',
          value: {
            firstName: 'María Fernanda',
            lastName: 'González López',
            typeDocumentIdentificationId: 1,
            documentNumber: 987654321000,
            birthDate: '1990-08-22',
            genderId: 2,
            phone: '+57 300 987 6543',
            email: 'maria.gonzalez@ejemplo.com',
            address: 'Calle 123 #45-67',
            zoneId: 1
          }
        }
      }
    }),
    ApiCreatedResponse({
      description: 'Cliente creado',
      examples: {
        'success': {
          summary: 'Cliente creado exitosamente',
          value: {
            customMessage: 'Cliente creado correctamente',
            customer: {
              id: 3,
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'cobrador1@migestor.com',
              typeDocumentIdentificationId: 1,
              typeDocumentIdentificationName: 'Cédula de Ciudadanía',
              typeDocumentIdentificationCode: 'CC',
              documentNumber: 1234567890,
              birthDate: '2005-05-13',
              genderId: 1,
              genderName: 'Masculino',
              zoneId: 2,
              zoneName: 'Centro',
              zoneCode: 'CTR',
              createdAt: '2025-09-23 14:35:32',
              updatedAt: '2025-09-23 14:35:32'
            }
          }
        }
      }
    }),
    ApiBadRequestResponse({
      description: 'Unicidad o lógica',
      examples: {
        'duplicate-document': {
          summary: 'Documento ya registrado',
          value: {
            statusCode: 400,
            message: 'El número de documento ya está registrado.',
            error: 'Bad Request'
          }
        },
        'duplicate-email': {
          summary: 'Email ya registrado',
          value: {
            statusCode: 400,
            message: 'El email ya está registrado en el sistema.',
            error: 'Bad Request'
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
              'firstName no debe estar vacío',
              'email debe ser un email válido',
              'documentNumber debe tener al menos 6 caracteres'
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
      description: 'Sin permiso create.customers',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para crear clientes',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para crear clientes',
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
            message: 'Error interno del servidor al crear el cliente',
            error: 'Internal Server Error'
          }
        }
      }
    })
  );
}