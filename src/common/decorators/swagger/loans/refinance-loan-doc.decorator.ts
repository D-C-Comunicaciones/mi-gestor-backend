import { RefinanceLoanDto } from '@modules/loans/dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

export function SwaggerRefinanceLoan() {
    return applyDecorators(
        ApiOperation({
            summary: 'Refinanciar préstamo',
            description: 'Refinancia un préstamo inactivo, creando un nuevo préstamo con los datos actualizados.',
        }),
        ApiParam({ name: 'loanId', type: Number, example: 1 }),
        ApiBody({
            type: RefinanceLoanDto,
            description: 'Datos opcionales para refinanciar el préstamo',
            examples: {
                'refinanciar-basico': {
                    summary: 'Refinanciación básica',
                    description: 'Solo se actualiza la tasa de interés y el motivo',
                    value: {
                        interestRateId: 2,
                        reason: 'Mejores condiciones por buen historial crediticio',
                    },
                },
                'refinanciar-completo': {
                    summary: 'Refinanciación completa',
                    description: 'Se actualizan todos los parámetros aplicables',
                    value: {
                        interestRateId: 3,
                        penaltyRateId: 1,
                        paymentFrequencyId: 2,
                        termId: 18,
                        gracePeriodId: 2,
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Préstamo refinanciado correctamente',
            examples: {
                success: {
                    summary: 'Préstamo refinanciado exitosamente',
                    value: {
                        message: 'Préstamo refinanciado exitosamente',
                        code: 200,
                        status: 'success',
                        data: {
                            oldLoan: {
                                id: 1,
                                amount: 1000000,
                                status: 'refinanced',
                                isActive: false,
                                updatedAt: '2024-01-20T14:45:00.000Z',
                            },
                            newLoan: {
                                id: 2,
                                amount: 1200000,
                                interestRate: 2.2,
                                termId: 18,
                                gracePeriodId: 2,
                                customerId: 1,
                                status: 'active',
                                remainingBalance: 1200000,
                                isActive: true,
                                createdAt: '2024-01-20T14:45:00.000Z',
                            },
                        },
                    },
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Validación o lógica de negocio fallida',
            examples: {
                'cannot-refinance': {
                    summary: 'No se puede refinanciar',
                    value: {
                        statusCode: 400,
                        message: 'Solo se pueden refinanciar préstamos activos con saldo pendiente',
                        error: 'Bad Request',
                    },
                },
                'validation-error': {
                    summary: 'Errores de validación',
                    value: {
                        statusCode: 400,
                        message: [
                            'El nuevo plazo (termId) es obligatorio para créditos fixed_fee',
                            'El período de gracia (gracePeriodId) es obligatorio para créditos only_interests',
                        ],
                        error: 'Bad Request',
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Préstamo o recursos relacionados no encontrados',
            examples: {
                'loan-not-found': {
                    summary: 'Préstamo no encontrado',
                    value: {
                        statusCode: 404,
                        message: 'Préstamo con ID 1 no encontrado',
                        error: 'Not Found',
                    },
                },
                'status-not-found': {
                    summary: 'Estado "Refinanced" no encontrado',
                    value: {
                        statusCode: 404,
                        message: 'El estado "Refinanced" no fue encontrado. Ejecute el seed.',
                        error: 'Not Found',
                    },
                },
            },
        }),
        ApiUnprocessableEntityResponse({
            description: 'Errores de validación de campos opcionales',
            examples: {
                'validation-error': {
                    summary: 'Errores de validación de DTO',
                    value: {
                        statusCode: 422,
                        message: [
                            'interestRateId debe ser un número entero positivo',
                            'termId debe ser un número entero positivo',
                        ],
                        error: 'Unprocessable Entity',
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
            description: 'Permisos insuficientes',
            examples: {
                'insufficient-permissions': {
                    summary: 'Sin permisos para refinanciar préstamos',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para refinanciar préstamos',
                        error: 'Forbidden',
                    },
                },
            },
        }),
        ApiInternalServerErrorResponse({
            description: 'Error interno del servidor',
            examples: {
                'server-error': {
                    summary: 'Error al refinanciar préstamo',
                    value: {
                        statusCode: 500,
                        message: 'Error interno del servidor al refinanciar el préstamo',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}
