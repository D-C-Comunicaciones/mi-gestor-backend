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

export function SwaggerListLoans() {
    return applyDecorators(
        ApiOperation({
            summary: 'Listar préstamos',
            description: 'Retorna lista paginada de préstamos.',
        }),
        ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
        ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
        ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } }),
        ApiOkResponse({
            description: 'Listado obtenido',
            examples: {
                success: {
                    summary: 'Lista obtenida exitosamente',
                    value: {
                        customMessage: 'Préstamos obtenidos correctamente',
                        loans: [
                            {
                                id: 1,
                                amount: 1000000,
                                interestRate: 2.5,
                                termId: 12,
                                customerId: 1,
                                status: 'active',
                                remainingBalance: 800000,
                                totalInterest: 150000,
                                isActive: true,
                                createdAt: '2024-01-15T10:30:00.000Z',
                                updatedAt: '2024-01-20T14:45:00.000Z',
                            },
                            {
                                id: 2,
                                amount: 500000,
                                interestRate: 3.0,
                                termId: 6,
                                customerId: 2,
                                status: 'active',
                                remainingBalance: 300000,
                                totalInterest: 75000,
                                isActive: true,
                                createdAt: '2024-01-16T11:30:00.000Z',
                                updatedAt: '2024-01-21T15:45:00.000Z',
                            },
                        ],
                        meta: {
                            total: 25,
                            page: 1,
                            lastPage: 3,
                            limit: 10,
                            hasNextPage: true,
                        },
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'No existen registros',
            examples: {
                'no-records': {
                    summary: 'No se encontraron registros',
                    value: {
                        customMessage: 'No existen registros',
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
            description: 'No autenticado',
            examples: {
                'missing-token': {
                    summary: 'Token faltante',
                    value: { statusCode: 401, message: 'Token de acceso requerido', error: 'Unauthorized' },
                },
                'invalid-token': {
                    summary: 'Token inválido o expirado',
                    value: { statusCode: 401, message: 'Token de acceso inválido o expirado', error: 'Unauthorized' },
                },
            },
        }),
        ApiForbiddenResponse({
            description: 'Sin permiso view.loans',
            examples: {
                'insufficient-permissions': {
                    summary: 'Sin permisos para ver préstamos',
                    value: { statusCode: 403, message: 'No tienes permisos para ver los préstamos', error: 'Forbidden' },
                },
            },
        }),
        ApiInternalServerErrorResponse({
            description: 'Error interno del servidor',
            examples: {
                'server-error': {
                    summary: 'Error interno del servidor',
                    value: { statusCode: 500, message: 'Error interno del servidor al obtener los préstamos', error: 'Internal Server Error' },
                },
            },
        }),
    );
}
