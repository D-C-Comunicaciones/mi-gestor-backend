import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiQuery,
} from '@nestjs/swagger';

export function SwaggerMoratoryInterestsReportDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reporte de intereses moratorios',
      description: `Genera resumen y detalle de intereses moratorios dentro de un rango de fechas.

Parámetros opcionales:
- startDate: Fecha inicio (YYYY-MM-DD)
- endDate: Fecha fin (YYYY-MM-DD)

Ejemplos:
- /v1/reports/moratory-interests-report?startDate=2025-09-01&endDate=2025-09-30
- /v1/reports/moratory-interests-report (rango por defecto últimos 30 días)`,
    }),
    ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (YYYY-MM-DD)', example: '2025-09-22' }),
    ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (YYYY-MM-DD)', example: '2025-10-22' }),
    ApiOkResponse({
      description: 'Reporte de intereses moratorios obtenido correctamente',
      schema: {
        example: {
          code: 200,
          status: 'success',
          data: {
            moratoryInterestReport: {
              generatedAt: '2025-10-22 17:33:34',
              startDate: '2025-09-22',
              endDate: '2025-10-22',
              data: [
                {
                  status: 'Pagado',
                  records: [
                    {
                      installmentId: 384,
                      status: 'Pagado',
                      moratoryGenerated: 7500,
                      moratoryCollected: 7500,
                      moratoryDiscounted: 0,
                      moratoryRemaining: 0,
                      discountDescriptions: [],
                      createdAt: '2025-10-21'
                    }
                  ],
                  totalGenerated: 7500,
                  totalCollected: 7500,
                  totalDiscounted: 0,
                  totalRemaining: 0
                },
                {
                  status: 'Parcialmente pagado',
                  records: [
                    {
                      installmentId: 385,
                      status: 'Parcialmente pagado',
                      moratoryGenerated: 15000,
                      moratoryCollected: 1500,
                      moratoryDiscounted: 0,
                      moratoryRemaining: 13500,
                      discountDescriptions: [],
                      createdAt: '2025-10-21'
                    }
                  ],
                  totalGenerated: 15000,
                  totalCollected: 1500,
                  totalDiscounted: 0,
                  totalRemaining: 13500
                }
              ],
              summary: {
                totalGenerated: 75500,
                totalCollected: 9000,
                totalDiscounted: 28000,
                totalRemaining: 58500
              }
            }
          }
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron registros',
      schema: {
        example: {
          code: 200,
          status: 'error',
          message: 'No se encontraron datos para exportar para el reporte "moratory-interests-report" en el período especificado',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado.',
      schema: {
        example: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.reports.',
      schema: {
        example: {
          statusCode: 403,
          message: 'No tienes permisos para ver este reporte',
          error: 'Forbidden'
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error interno del servidor al generar el reporte',
          error: 'Internal Server Error'
        }
      }
    }),
  );
}
