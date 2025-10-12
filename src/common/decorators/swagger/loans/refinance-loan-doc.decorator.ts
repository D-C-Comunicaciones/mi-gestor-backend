import { RefinanceLoanDto } from '@modules/loans/dto';
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
    ApiBadRequestResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

export function SwaggerRefinanceLoan() {
    return applyDecorators(
        ApiOperation({
            summary: 'Refinanciar préstamo',
            description: 'Refinancia un préstamo inactivo, creando uno nuevo.',
        }),
        ApiParam({ name: 'id', type: Number, example: 1 }),
        ApiBody({
            type: RefinanceLoanDto,
            description: 'Datos para refinanciar el préstamo',
            examples: {
                'refinanciar-basico': {
                    summary: 'Refinanciación básica',
                    description: 'Ejemplo de refinanciación con nuevos términos',
                    value: {
                        newAmount: 1200000,
                        newInterestRate: 2.2,
                        newTermId: 18,
                        reason: 'Mejores condiciones por buen historial crediticio',
                    },
                },
                'refinanciar-completo': {
                    summary: 'Refinanciación completa',
                    description: 'Ejemplo de refinanciación con todos los parámetros',
                    value: {
                        newAmount: 1500000,
                        newInterestRate: 2.8,
                        newTermId: 24,
                        paymentFrequencyId: 2,
                        reason: 'Consolidación de deudas y ampliación del plazo',
                        startDate: '2024-03-01',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Préstamo refinanciado',
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
            description: 'Validación / lógica',
            examples: {
                'cannot-refinance': {
                    summary: 'No se puede refinanciar',
                    value: {
                        statusCode: 400,
                        message: 'Solo se pueden refinanciar préstamos inactivos o completamente pagados',
                        error: 'Bad Request',
                    },
                },
                'validation-error': {
                    summary: 'Errores de validación',
                    value: {
                        statusCode: 400,
                        message: [
                            'El nuevo monto debe ser mayor a 0',
                            'La nueva tasa debe estar entre 1 y 50',
                        ],
                        error: 'Bad Request',
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Préstamo a refinanciar no encontrado',
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
        ApiUnprocessableEntityResponse({
            description: 'Errores de validación',
            examples: {
                'validation-error': {
                    summary: 'Errores de validación',
                    value: {
                        statusCode: 422,
                        message: [
                            'newAmount debe ser un número positivo',
                            'newInterestRate es requerido',
                            'reason debe ser una cadena de texto',
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
            description: 'Sin permiso refinance.loans',
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
                    summary: 'Error interno del servidor',
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
