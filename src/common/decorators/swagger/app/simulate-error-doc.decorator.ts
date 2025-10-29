import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerSimulateErrorDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Simula un error interno del servidor',
      description:
        'Lanza una excepción HttpException con estado 500 para pruebas o manejo de errores.',
    }),
    ApiResponse({
      status: 500,
      description: 'Error simulado para testing.',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error simulado para testing',
        },
      },
    }),
  );
}