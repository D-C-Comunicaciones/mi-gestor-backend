import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiParam } from '@nestjs/swagger';

export function SwaggerFindOneCustomerDoc() {
    return applyDecorators(
        ApiOperation({ summary: 'Obtener cliente', description: 'Retorna un cliente por id.' }),
        ApiParam({ name: 'id', type: Number, example: 1 }),
        ApiOkResponse({
            description: 'Cliente encontrado',
            examples: {
                'success': {
                    summary: 'Cliente encontrado exitosamente',
                    value: {
                        customMessage: 'Cliente obtenido correctamente',
                        customer: {
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
                        loans: [
                            {
                                id: 1,
                                amount: 1000000,
                                interestRate: 2.5,
                                status: 'active',
                                createdAt: '2024-01-15T10:30:00.000Z'
                            }
                        ],
                        user: {
                            id: 1,
                            email: 'juan.perez@ejemplo.com',
                            name: 'Juan Pérez',
                            isActive: true
                        }
                    }
                }
            }
        }),
        ApiNotFoundResponse({
            description: 'Cliente no encontrado',
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
                    summary: 'Sin permisos para ver cliente',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para ver este cliente',
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
                        message: 'Error interno del servidor al obtener el cliente',
                        error: 'Internal Server Error'
                    }
                }
            }
        })
    );
}