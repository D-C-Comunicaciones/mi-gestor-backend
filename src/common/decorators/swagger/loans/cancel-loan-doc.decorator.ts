import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
    ApiBadRequestResponse,
    ApiParam,
} from '@nestjs/swagger';

export function SwaggerCancelLoan() {
    return applyDecorators(
        ApiOperation({
            summary: 'Cancelar préstamo',
            description:
                'Cancela un préstamo activo cambiando su estado a cancelado. Esta acción es irreversible y marca el préstamo como inactivo.',
        }),
        ApiParam({
            name: 'id',
            type: Number,
            description: 'ID único del préstamo a cancelar',
            example: 16,
        }),
        ApiOkResponse({
            description: 'Préstamo cancelado exitosamente',
            examples: {
                success: {
                    summary: 'Préstamo cancelado exitosamente',
                    value: {
                        message: 'Crédito cancelado correctamente',
                        code: 200,
                        status: 'success',
                        data: {
                            loan: {
                                id: 16,
                                customerId: 1,
                                loanAmount: '1000000.00',
                                remainingBalance: '500000.00',
                                loanStatusId: 6,
                                loanStatusName: 'Cancelado',
                                isActive: false,
                                canceledAt: '2024-01-20T14:45:00.000Z',
                                updatedAt: '2024-01-20T14:45:00.000Z',
                                customer: {
                                    id: 1,
                                    firstName: 'Juan',
                                    lastName: 'Pérez',
                                    documentNumber: '12345678',
                                },
                            },
                        },
                    },
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Préstamo no se puede cancelar',
            examples: {
                'already-inactive': {
                    summary: 'Préstamo ya inactivo',
                    value: {
                        statusCode: 400,
                        message: 'No se puede cancelar un préstamo que ya está inactivo',
                        error: 'Bad Request',
                    },
                },
                'already-canceled': {
                    summary: 'Préstamo ya cancelado',
                    value: {
                        statusCode: 400,
                        message: 'El préstamo ya se encuentra cancelado',
                        error: 'Bad Request',
                    },
                },
                'loan-completed': {
                    summary: 'Préstamo completamente pagado',
                    value: {
                        statusCode: 400,
                        message: 'No se puede cancelar un préstamo que ya está completamente pagado',
                        error: 'Bad Request',
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
                        message: 'Préstamo con ID 16 no encontrado',
                        error: 'Not Found',
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'No autorizado - Token de acceso requerido o inválido',
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
            description: 'Acceso prohibido - Sin permisos para cancelar préstamos',
            examples: {
                'insufficient-permissions': {
                    summary: 'Sin permisos para cancelar préstamos',
                    value: {
                        statusCode: 403,
                        message: 'No tienes permisos para cancelar préstamos',
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
                        message: 'Error interno del servidor al cancelar el préstamo',
                        error: 'Internal Server Error',
                    },
                },
                'database-error': {
                    summary: 'Error de base de datos',
                    value: {
                        statusCode: 500,
                        message: 'Error de base de datos al actualizar el estado del préstamo',
                        error: 'Internal Server Error',
                    },
                },
            },
        }),
    );
}