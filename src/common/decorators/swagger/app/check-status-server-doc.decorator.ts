import { applyDecorators } from '@nestjs/common';
import {ApiOperation,ApiOkResponse,ApiBadRequestResponse,ApiUnauthorizedResponse,ApiForbiddenResponse,ApiInternalServerErrorResponse,ApiTags } from '@nestjs/swagger';

export function SwaggerGetServerStatus() {
  return applyDecorators(
    ApiTags('Servidor'),
    ApiOperation({
      summary: 'Verificar el estado del servidor',
      description:
        'Devuelve información en tiempo real sobre el estado del servidor, incluyendo uso de memoria, uptime, carga del sistema y fecha actual.',
    }),
    ApiOkResponse({
      description: 'Estado del servidor obtenido correctamente.',
      schema: {
        example: {
          status: 'ok',
          message: 'Servidor en funcionamiento',
          timestamp: '2025-10-24 - 17:34:20',
          uptime: '00:02:02',
          memory: {
            rssMB: '83.12',
            heapUsedMB: '47.32',
            heapTotalMB: '61.23',
          },
          system: {
            platform: 'win32',
            architecture: 'x64',
            loadAverage: ['0.01', '0.02', '0.03'],
            freeMemoryMB: '8192.44',
            totalMemoryMB: '16246.88',
          },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Parámetros inválidos en la solicitud.' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token inválido o faltante.' }),
    ApiForbiddenResponse({ description: 'Sin permisos para acceder a este recurso.' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor.' }),
  );
}
