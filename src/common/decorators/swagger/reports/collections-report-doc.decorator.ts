
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export function SwaggerCollectionsReport() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener reporte de valores de cobros',
      description: 'Retorna resumen de cobros, colecciones y desempeño de cobradores en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-11-01',
      description: 'Fecha de inicio (Formato YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-11-11',
      description: 'Fecha de fin (Formato YYYY-MM-DD)',
    }),
    ApiOkResponse({
      description: 'Resumen de valores de cobros obtenido exitosamente',
      examples: {
        success: {
          summary: 'Resumen de cobros generado exitosamente',
          value: {
            message: 'Resumen de valores de cobros obtenido exitosamente',
            code: 200,
            status: 'success',
            data: {
              collectionsReport: {
                startDate: '2025-11-01',
                endDate: '2025-11-11',
                summary: {
                  totalCollections: 0,
                  totalAssigned: 0,
                  totalCollected: 0,
                  totalPending: 0,
                  globalPerformancePercentage: 0,
                  activeCollectors: 0,
                  uniqueCustomers: 0,
                  uniqueLoans: 0,
                  totalInstallmentsInPeriod: 0,
                  totalInstallmentsPaid: 0,
                  totalInstallmentsPending: 0,
                  averageCollectedPerCollector: 0,
                  averageCollectionAmount: 0,
                  bestPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, totalCollectionsMade: 0, route: 'N/A' },
                  worstPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, totalCollectionsMade: 0, route: 'N/A' },
                  leastActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                  bestCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                  worstCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                  mostActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                  chartData: { collectorPerformance: [], collectorComparison: [], collectorActivity: [], globalStats: { assigned: 0, collected: 0, pending: 0, percentage: 0 } }
                },
                collectorSummary: [],
                collections: [],
                metadata: { totalRecords: 0, generatedAt: '2025-10-08', period: '2025-11-01 al 2025-11-11', totalCollectors: 0, activeCollectors: 0 }
              }
            }
          }
        }
      }
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron datos en el rango de fechas',
      examples: {
        notFound: {
          summary: 'No hay datos en el período',
          value: {
            message: 'No se encontraron datos de préstamos en el rango de fechas proporcionado.',
            code: 404,
            status: 'error',
            errors: null,
            trace: 'NotFoundException: No se encontraron datos de préstamos en el rango de fechas proporcionado.'
          }
        }
      }
    }),
    ApiBadRequestResponse({
      description: 'Parámetros inválidos',
      examples: {
        invalidParams: {
          summary: 'Datos enviados inválidos',
          value: {
            message: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate'],
            code: 400,
            status: 'error',
            errors: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate']
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      examples: {
        missingToken: {
          summary: 'Token faltante',
          value: { message: 'Token de acceso requerido', code: 401, status: 'error', errors: null }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos para ver reportes',
          value: { message: 'No tienes permisos para ver los reportes', code: 403, status: 'error', errors: null }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: { message: 'Error interno del servidor al generar el reporte', code: 500, status: 'error', errors: null }
        }
      }
    })
  );
}