import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
    ApiQuery,
} from '@nestjs/swagger';

export function SwaggerListLoansByCollector() {
    return applyDecorators(
        ApiOperation({
            summary: 'Listar préstamos por rutas del cobrador',
            description:
                'Retorna una lista paginada de préstamos correspondientes a los clientes asignados a las rutas del cobrador vinculado al usuario autenticado.',
        }),
        ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
        ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
        ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } }),
        ApiOkResponse({
            description: 'Listado de préstamos obtenido correctamente',
            examples: {
                success: {
                    summary: 'Lista obtenida exitosamente',
                    value: {
                        customMessage: 'Préstamos obtenidos correctamente (por rutas del cobrador)',
                        loans: [
                            {
                                id: 5,
                                amount: 1200000,
                                interestRate: 2.8,
                                termId: 8,
                                customerId: 15,
                                status: 'active',
                                remainingBalance: 900000,
                                totalInterest: 180000,
                                isActive: true,
                                createdAt: '2024-02-10T10:00:00.000Z',
                                updatedAt: '2024-02-15T13:30:00.000Z',
                            },
                        ],
                        meta: {
                            total: 12,
                            page: 1,
                            lastPage: 2,
                            limit: 10,
                            hasNextPage: true,
                        },
                    },
                },
            },
        }),

        ApiNotFoundResponse({
            description: 'No existen préstamos asignados a las rutas del cobrador',
            examples: {
                'no-loans': {
                    summary: 'No se encontraron préstamos para las rutas del cobrador',
                    value: {
                        customMessage: 'No existen préstamos asignados a las rutas del cobrador',
                        loans: [],
                        meta: {
                            total: 0,
                            page: 1,
                            lastPage: 0,
                            limit: 10,
                            hasNextPage: false,
                        },
                    },
                },
            },
        }),

        ApiUnauthorizedResponse({
            description: 'Usuario no autenticado o token inválido',
            examples: {
                'missing-token': {
                    summary: 'Token faltante',
                    value: {
                        statusCode: 401,
                        message: 'Token de acceso requerido',
                        error: 'Unauthorized',
                    },
                },
                'invalid-token': {
                    summary: 'Token inválido o expirado',
                    value: {
                        statusCode: 401,
                        message: 'Token de acceso inválido o expirado',
                        error: 'Unauthorized',
                    },
                },
            },
        }),

        ApiForbiddenResponse({
            description: 'Sin permiso view.loans',
            examples: {
                'insufficient-permissions': {
                    summary: 'Sin permisos para ver préstamos',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para ver los préstamos',
                        error: 'Forbidden',
                    },
                },
            },
        }),

        ApiInternalServerErrorResponse({
            description: 'Error interno del servidor',
            examples: {
                'server-error': {
                    summary: 'Error interno del servidor',
                    value: {
                        statusCode: 500,
                        message:
                            'Error interno del servidor al obtener los préstamos por rutas del cobrador',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}