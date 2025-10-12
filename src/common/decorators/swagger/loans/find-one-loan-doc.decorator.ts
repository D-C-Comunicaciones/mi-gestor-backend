import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse
} from '@nestjs/swagger';

// Decorador para documentar endpoint de obtención de préstamo por ID
export function SwaggerLoanById() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener préstamo',
            description: 'Retorna un préstamo por id.',
        }),
        ApiParam({ name: 'id', type: Number, example: 1 }),
        ApiOkResponse({
            description: 'Préstamo encontrado',
            examples: {
                success: {
                    summary: 'Préstamo encontrado exitosamente',
                    value: {
                        customMessage: 'Préstamo obtenido correctamente',
                        loan: {
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
                            customer: {
                                id: 1,
                                firstName: 'Juan',
                                lastName: 'Pérez',
                                email: 'juan.perezejemplo.com',
                            },
                            installments: [
                                {
                                    id: 1,
                                    installmentNumber: 1,
                                    capitalAmount: 80000,
                                    interestAmount: 25000,
                                    totalAmount: 105000,
                                    dueDate: '2024-02-15',
                                    isPaid: true,
                                    paidAt: '2024-02-14T16:30:00.000Z',
                                },
                            ],
                        },
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Préstamo no encontrado',
            examples: {
                'loan-not-found': {
                    summary: 'Préstamo no encontrado',
                    value: {
                        statusCode: 404,
                        message: 'Préstamo con ID 1 no encontrado',
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
                    summary: 'Sin permisos para ver préstamo',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para ver este préstamo',
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
                        message: 'Error interno del servidor al obtener el préstamo',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}