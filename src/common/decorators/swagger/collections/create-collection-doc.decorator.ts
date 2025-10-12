import { CreateCollectionDto, ResponseCollectionDto } from '@modules/collections/dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse
} from '@nestjs/swagger';

// Decorador para documentar endpoint de creación de cobros
export function SwaggerCreateCollection() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar cobro',
      description:
        'Registra un nuevo cobro en el sistema. Permite registrar pagos de cuotas, intereses o moratorias',
    }),
    ApiBody({
      type: CreateCollectionDto,
      description: 'Datos del cobro a registrar',
      // Aquí puedes poner ejemplos o reutilizar un objeto externo
    }),
    ApiCreatedResponse({
      description: 'Cobro registrado exitosamente',
      type: ResponseCollectionDto,
    }),
    ApiBadRequestResponse({ description: 'Datos inválidos o lógica de negocio' }),
    ApiUnprocessableEntityResponse({ description: 'Errores de validación' }),
    ApiNotFoundResponse({ description: 'Recurso no encontrado' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token inválido o faltante' }),
    ApiForbiddenResponse({ description: 'Sin permisos' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor' }),
  );
}