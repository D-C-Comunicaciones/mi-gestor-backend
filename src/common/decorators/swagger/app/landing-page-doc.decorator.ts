import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerAppDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Devuelve una página HTML de bienvenida',
      description:
        'Obtiene el contenido HTML generado por el servicio principal y lo envía directamente como respuesta.',
    }),
    ApiResponse({
      status: 200,
      description: 'HTML enviado correctamente.',
      content: {
        'text/html': {
          example: '<html><body><h1>Bienvenido a la API</h1></body></html>',
        },
      },
    }),
  );
}