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

export function SwaggerLoansReport() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener resumen de créditos nuevos y refinanciados',
      description: 'Retorna el valor total y conteo de créditos y refinanciados en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-01-01',
      description: 'Fecha de inicio (Formato YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-12-31',
      description: 'Fecha de fin (Formato YYYY-MM-DD)',
    }),
    ApiOkResponse({
      description: 'Resumen de créditos obtenido correctamente',
      examples: {
        success: {
          summary: 'Resumen de créditos generado exitosamente',
          value: {
            message: 'Resumen de créditos obtenido correctamente',
            code: 200,
            status: 'success',
            data: {
              loansReport: {
                startDate: '2025-09-08',
                endDate: '2025-10-08',
                numberOfNewLoans: 3,
                newLoansTotalAmount: 3000000,
                newLoansDetails: [
                  {
                    id: 19,
                    loanAmount: 1000000,
                    remainingBalance: 1000000,
                    startDate: '2025-10-01',
                    nextDueDate: '2025-10-01',
                    graceEndDate: 'N/A',
                    requiresCapitalPayment: 'No',
                    interestRateId: 15,
                    interestRateName: '15%',
                    interestRateValue: 15,
                    penaltyRateId: 1,
                    penaltyRateName: 'Mora legal máxima',
                    penaltyRateValue: 0.05,
                    termId: 6,
                    termValue: 6,
                    gracePeriodId: null,
                    gracePeriodName: 'N/A',
                    gracePeriodDays: 0,
                    paymentFrequencyId: 5,
                    paymentFrequencyName: 'Minute',
                    loanTypeId: 1,
                    loanTypeName: 'Cuotas Fijas',
                    creditTypeName: 'Cuotas Fijas',
                    loanStatusId: 2,
                    loanStatusName: 'En Mora',
                    customerId: 3,
                    customerName: 'armando betancourt',
                    customerDocument: 1234567892,
                    customerAddress: 'en su casa',
                    customerPhone: '+573001234567'
                  }
                  // ...otros préstamos
                ],
                numberOfRefinancedLoans: 0,
                refinancedLoansTotalAmount: 0,
                refinancedLoansDetails: [],
                summary: {
                  numberOfNewLoans: 3,
                  newLoansTotalAmount: 3000000,
                  numberOfRefinancedLoans: 0,
                  refinancedLoansTotalAmount: 0,
                  totalLoans: 3,
                  totalAmount: 3000000,
                  averageLoanAmount: 1000000
                },
                metadata: {
                  totalRecords: 3,
                  generatedAt: '2025-10-08 17:55:06',
                  period: '2025-09-08 al 2025-10-08'
                }
              }
            }
          }
        }
      }
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron datos de préstamos en el rango de fechas',
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
          value: {
            message: 'Token de acceso requerido',
            code: 401,
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos para ver reportes',
          value: {
            message: 'No tienes permisos para ver los reportes',
            code: 403,
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: {
            message: 'Error interno del servidor al generar el reporte',
            code: 500,
            status: 'error',
            errors: null
          }
        }
      }
    })
  );
}
