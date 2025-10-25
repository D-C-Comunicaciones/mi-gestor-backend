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

export function SwaggerInterestsReportDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reporte de intereses corrientes recaudados',
      description: `Genera resumen y detalle de intereses corrientes recaudados dentro de un rango de fechas.

Parámetros opcionales:
- startDate: Fecha inicio (YYYY-MM-DD)
- endDate: Fecha fin (YYYY-MM-DD)

Ejemplos:
- /v1/reports/interests-report?startDate=2025-09-01&endDate=2025-09-30
- /v1/reports/interests-report (rango por defecto últimos 30 días)`,
    }),
    ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (YYYY-MM-DD)', example: '2025-09-22' }),
    ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (YYYY-MM-DD)', example: '2025-10-22' }),
    ApiOkResponse({
      description: 'Reporte de intereses corrientes obtenido correctamente',
      schema: {
        example: {
          code: 200,
          status: 'success',
          data: {
            interestsReport: {
              generatedAt: '2025-10-22 17:33:34',
              startDate: '2025-09-22',
              endDate: '2025-10-22',
              data: [
                {
                  customerId: 1,
                  customerName: 'Juan Pérez',
                  customerDocument: '12345678',
                  totalInterestCollected: 50000,
                  totalCapitalCollected: 200000,
                  totalLateFeeCollected: 5000,
                  totalCollected: 255000,
                  paymentsCount: 10,
                  records: [
                    {
                      paymentId: 123,
                      installmentId: 456,
                      loanId: 789,
                      customerId: 1,
                      customerName: 'Juan Pérez',
                      customerDocument: '12345678',
                      collectorId: 5,
                      collectorName: 'Fernando Torres',
                      paymentDate: '2025-10-15',
                      interestCollected: 5000,
                      capitalCollected: 20000,
                      lateFeeCollected: 500,
                      totalCollected: 25500
                    }
                  ]
                }
              ],
              summary: {
                totalInterestCollected: 50000,
                totalCapitalCollected: 200000,
                totalLateFeeCollected: 5000,
                totalCollected: 255000,
                totalPayments: 10,
                totalCustomers: 1
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
          message: 'No se encontraron datos para exportar para el reporte "interests-report" en el período especificado',
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
