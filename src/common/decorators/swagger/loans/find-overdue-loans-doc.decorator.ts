import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
    ApiQuery,
    ApiBadRequestResponse,
} from '@nestjs/swagger';

export function SwaggerOverdueLoans() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener préstamos en mora',
            description:
                'Retorna lista paginada de préstamos que tienen cuotas en mora con información del cliente.',
        }),
        ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, description: 'Número de página' } }),
        ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, description: 'Elementos por página' } }),
        ApiOkResponse({
            description: 'Préstamos en mora obtenidos correctamente',
            examples: {
                success: {
                    summary: 'Préstamos en mora obtenidos exitosamente',
                    value: {
                        message: 'Préstamos en mora obtenidos correctamente',
                        code: 200,
                        status: 'success',
                        data: {
                            overdueLoans: [
                                {
                                    loanId: 19,
                                    loanAmount: '1000000.00',
                                    remainingBalance: '1000000.00',
                                    loanTypeName: 'Cuotas Fijas',
                                    startDate: '2025-10-02',
                                    totalDaysLate: 0,
                                    totalAmountOwed: '0.00',
                                    customer: {
                                        id: 3,
                                        name: 'armando betancourt',
                                        documentNumber: '1234567892',
                                        phone: '+573001234567',
                                        address: 'en su casa',
                                        zoneName: 'Sur',
                                        zoneCode: 'SUR',
                                    },
                                },
                            ],
                            meta: {
                                total: 2,
                                page: 1,
                                lastPage: 1,
                                limit: 10,
                                hasNextPage: false,
                            },
                        },
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'No se encontraron préstamos en mora',
            examples: {
                'no-overdue-loans': {
                    summary: 'No hay préstamos en mora',
                    value: {
                        message: 'No se encontraron préstamos en mora',
                        code: 404,
                        status: 'error',
                        data: {
                            overdueLoans: [],
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
            },
        }),
        ApiBadRequestResponse({
            description: 'Parámetros de consulta inválidos',
            examples: {
                'pagination-error': {
                    summary: 'Parámetros de paginación inválidos',
                    value: {
                        statusCode: 400,
                        message: ['page debe ser un número positivo', 'limit debe estar entre 1 y 100'],
                        error: 'Bad Request',
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'No autenticado',
            examples: {
                'missing-token': {
                    summary: 'Token faltante',
                    value: {
                        statusCode: 401,
                        message: 'Token de acceso requerido',
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
                        message: 'Error interno del servidor al obtener los préstamos en mora',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}
