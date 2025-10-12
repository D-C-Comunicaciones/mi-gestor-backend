import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerViewLoanByCustomerId() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener préstamos por cliente',
            description: 'Retorna lista de préstamos de un cliente, con la última cuota.',
        }),
        ApiParam({ name: 'id', type: Number, example: 1 }),
        ApiOkResponse({
            description: 'Préstamos obtenidos correctamente',
            examples: {
                success: {
                    summary: 'Préstamos del cliente obtenidos exitosamente',
                    value: {
                        message: 'Préstamos obtenidos correctamente',
                        code: 200,
                        status: 'success',
                        data: {
                            loanByCustomer: {
                                id: 1,
                                firstName: 'Juan',
                                lastName: 'Pérez',
                                email: 'juan.perezejemplo.com',
                                loans: [
                                    {
                                        id: 1,
                                        amount: 1000000,
                                        interestRate: 2.5,
                                        status: 'active',
                                        remainingBalance: 800000,
                                        lastInstallment: {
                                            id: 12,
                                            installmentNumber: 12,
                                            capitalAmount: 80000,
                                            interestAmount: 25000,
                                            totalAmount: 105000,
                                            dueDate: '2024-12-15',
                                            isPaid: false,
                                        },
                                    },
                                    {
                                        id: 2,
                                        amount: 500000,
                                        interestRate: 3.0,
                                        status: 'paid',
                                        remainingBalance: 0,
                                        lastInstallment: {
                                            id: 6,
                                            installmentNumber: 6,
                                            capitalAmount: 85000,
                                            interestAmount: 15000,
                                            totalAmount: 100000,
                                            dueDate: '2023-12-15',
                                            isPaid: true,
                                            paidAt: '2023-12-14T10:30:00.000Z',
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Cliente no encontrado',
            examples: {
                'customer-not-found': {
                    summary: 'Cliente no encontrado',
                    value: {
                        statusCode: 404,
                        message: 'Cliente con ID 1 no encontrado',
                        error: 'Not Found',
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
                        message: 'Error interno del servidor al obtener los préstamos del cliente',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}
