import { CreateDiscountDto } from '@modules/discounts/dto/create-discount.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerCreateDiscountDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear un nuevo descuento',
      description:
        'Crea un nuevo descuento en el sistema con los datos proporcionados. Requiere permisos de creación.',
    }),
    ApiBody({
      type: CreateDiscountDto,
      description: 'Datos del descuento a crear',
      examples: {
        'descuento-buen-pago': {
          summary: 'Descuento por buen comportamiento',
          description:
            'Ejemplo de descuento por buen comportamiento de pago aplicado a un crédito',
          value: {
            amount: 88100,
            discountTypeId: 1,
            description:
              'Descuento por buen comportamiento de pago a cuota, para que pague',
            loanId: 1,
          },
        },
        'descuento-promocional': {
          summary: 'Descuento promocional',
          description:
            'Ejemplo de descuento promocional estándar sobre un crédito',
          value: {
            amount: 50000,
            discountTypeId: 2,
            description: 'Descuento promocional del mes de diciembre',
            loanId: 2,
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Descuento creado exitosamente',
      examples: {
        success: {
          summary: 'Descuento creado exitosamente',
          value: {
            message: 'Descuento creado exitosamente',
            responseDiscount: [
              {
                id: 1,
                amount: '15000',
                discountTypeId: 1,
                description:
                  'Descuento por buen comportamiento de pago a cuota, para que pague. DESCRIPCIÓN APLICADA POR EL SISTEMA: descuento de 15000 aplicado a interés moratorio ID 4 (cuota 1), generado por: 1 - admin@dcmigestor.co',
                moratoryId: 4,
                installmentId: 14,
                loanId: 3,
                isActive: true,
                createdAt: '2025-10-07T00:00:00.000Z',
              },
            ],
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Datos de entrada inválidos o error de lógica de negocio',
      examples: {
        'validation-error': {
          summary: 'Errores de validación',
          value: {
            statusCode: 400,
            message: [
              'El monto del descuento debe ser mayor a cero',
              'La descripción es requerida',
              'El ID del préstamo debe ser un número positivo',
            ],
            error: 'Bad Request',
          },
        },
        'business-error': {
          summary: 'Error de lógica de negocio',
          value: {
            statusCode: 400,
            message:
              'El monto del descuento (100000) no puede ser mayor al total de intereses moratorios pendientes (50000) para este préstamo',
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
              'El monto debe ser un número',
              'La descripción es requerida',
              'El ID del tipo de descuento debe ser un número positivo',
              'El ID del préstamo es requerido',
            ],
            error: 'Unprocessable Entity',
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
      description: 'Acceso prohibido - Sin permisos para crear descuentos',
      examples: {
        'insufficient-permissions': {
          summary: 'Permisos insuficientes',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para crear descuentos',
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
            message: 'Error interno del servidor al crear el descuento',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}
