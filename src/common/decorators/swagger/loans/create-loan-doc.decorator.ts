import { CreateLoanDto } from '@modules/loans/dto';
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
    ApiCreatedResponse,
} from '@nestjs/swagger';

// Decorador para documentar endpoint de creación de préstamos
export function SwaggerCreateLoan() {
    return applyDecorators(
        ApiOperation({
            summary: 'Crear préstamo',
            description: 'Crea un préstamo (puede generar cuotas).',
        }),
        ApiBody({
            type: CreateLoanDto,
            description: 'Datos del préstamo a crear',
            examples: {
                'cuotas-fijas': {
                    summary: 'Préstamo de cuotas fijas',
                    description: 'Ejemplo de préstamo con cuotas fijas mensuales',
                    value: {
                        customerId: 1,
                        loanAmount: '1000000',
                        interestRateId: 10,
                        termId: 12,
                        paymentFrequencyId: 5,
                        loanTypeId: 1,
                        penaltyRateId: 1,
                    },
                },
                'solo-intereses': {
                    summary: 'Préstamo de solo intereses',
                    description: 'Ejemplo de préstamo que paga solo intereses con período de gracia',
                    value: {
                        customerId: 2,
                        loanAmount: '2500000',
                        interestRateId: 8,
                        termId: 24,
                        paymentFrequencyId: 3,
                        loanTypeId: 2,
                        penaltyRateId: 2,
                        gracePeriodId: 1,
                    },
                },
                'prestamo-semanal': {
                    summary: 'Préstamo con pagos semanales',
                    description: 'Ejemplo de préstamo con frecuencia de pago semanal',
                    value: {
                        customerId: 3,
                        loanAmount: '500000',
                        interestRateId: 12,
                        termId: 8,
                        paymentFrequencyId: 2,
                        loanTypeId: 1,
                        penaltyRateId: 1,
                    },
                },
            },
        }),
        ApiCreatedResponse({
            description: 'Préstamo creado',
            examples: {
                success: {
                    summary: 'Préstamo creado exitosamente',
                    value: {
                        customMessage: 'Préstamo creado correctamente',
                        loan: {
                            id: 13,
                            customerId: 1,
                            loanAmount: '1000000',
                            remainingBalance: '1000000',
                            interestRateId: 10,
                            interestRateValue: '10',
                            termId: 12,
                            termValue: 12,
                            paymentFrequencyId: 5,
                            paymentFrequencyName: 'Minute',
                            loanTypeId: 1,
                            loanTypeName: 'fixed_fees',
                            loanStatusId: 1,
                            loanStatusName: 'Up to Date',
                            startDate: '2025-09-22',
                            nextDueDate: '2025-09-22',
                            gracePeriodId: null,
                            graceEndDate: null,
                            graceDaysLeft: null,
                            isActive: true,
                            createdAt: '2025-09-23 13:37:17',
                            updatedAt: '2025-09-23 13:37:18',
                            customer: {
                                id: 1,
                                firstName: 'Juan',
                                lastName: 'Pérez',
                                email: 'customerdcmigestor.co',
                                typeDocumentIdentificationId: 1,
                                typeDocumentIdentificationName: 'Cédula de Ciudadanía',
                                typeDocumentIdentificationCode: 'CC',
                                documentNumber: 111222333,
                                birthDate: '1990-05-13',
                                genderId: 1,
                                genderName: 'Masculino',
                                phone: '3005556666',
                                address: 'Calle 100 #50-60',
                                zoneId: 2,
                                zoneName: 'Centro',
                                zoneCode: 'CTR',
                                isActive: true,
                                createdAt: '',
                                updatedAt: '',
                            },
                            firstInstallment: {
                                id: 85,
                                loanId: 13,
                                sequence: 1,
                                dueDate: '2025-09-21',
                                capitalAmount: '46763.32',
                                interestAmount: '100000',
                                totalAmount: '146763.32',
                                paidAmount: '0',
                                isPaid: false,
                                isActive: true,
                                statusId: 4,
                                paidAt: null,
                                createdAt: '2025-09-23 13:37:17',
                                updatedAt: '2025-09-23 13:37:17',
                            },
                        },
                    },
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Validación / lógica',
            examples: {
                'validation-error': {
                    summary: 'Errores de validación',
                    value: {
                        statusCode: 400,
                        message: [
                            'El monto del préstamo debe ser mayor a 0',
                            'La tasa de interés debe existir',
                            'El cliente debe existir y estar activo',
                        ],
                        error: 'Bad Request',
                    },
                },
                'business-error': {
                    summary: 'Error de lógica de negocio',
                    value: {
                        statusCode: 400,
                        message: 'El cliente ya tiene un préstamo activo del mismo tipo',
                        error: 'Bad Request',
                    },
                },
                'grace-period-error': {
                    summary: 'Error de período de gracia',
                    value: {
                        statusCode: 400,
                        message: 'El período de gracia solo se aplica a créditos de tipo "solo intereses"',
                        error: 'Bad Request',
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
                            'customerId debe ser un número positivo',
                            'loanAmount debe ser una cadena numérica válida',
                            'interestRateId es requerido',
                            'termId debe existir',
                            'paymentFrequencyId debe ser válido',
                            'loanTypeId debe ser 1 (cuotas fijas) o 2 (solo intereses)',
                            'penaltyRateId es requerido',
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
            description: 'Sin permiso create.loans',
            examples: {
                'insufficient-permissions': {
                    summary: 'Sin permisos para crear préstamos',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para crear préstamos',
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
                        message: 'Error interno del servidor al crear el préstamo',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}