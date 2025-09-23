import { Controller, Get, Query, Res, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiExtraModels, ApiParam, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiProduces } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { ReportsService } from './reports.service';
import { DateRangeDto } from '@common/dto';
import { ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto } from './dto';
import { ReportLoanSummaryResponse } from './interfaces';
import { Response } from 'express';
import { ReportsExporterService } from './reports-exporter.service'; // 👈 Nuevo import
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Reports')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExporterService: ReportsExporterService // 👈 Inyección del nuevo servicio
  ) { }

  @Get('loans-summary')
  @Permissions('view.reports')
  @ApiOperation({
    summary: 'Obtener reporte de préstamos nuevos y refinanciados',
    description: 'Retorna el valor total y conteo de créditos y refinanciados en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    example: '2025-01-01',
    description: 'Fecha de inicio (Formato YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    example: '2025-12-31',
    description: 'Fecha de fin (Formato YYYY-MM-DD)',
  })
  @ApiOkResponse({
    description: 'Reporte generado correctamente',
    examples: {
      'success': {
        summary: 'Reporte generado exitosamente',
        value: {
          customMessage: 'Resumen de valores de créditos obtenido exitosamente',
          loansSummary: {
            numberOfNewLoans: 5,
            newLoansTotalAmount: 4500000,
            newLoansDetails: [
              {
                id: 3,
                loanAmount: 1000000,
                startDate: '2025-09-14',
                loanStatusName: 'Up to Date',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              },
              {
                id: 4,
                loanAmount: 500000,
                startDate: '2025-09-14',
                loanStatusName: 'Paid',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              },
              {
                id: 12,
                loanAmount: 1000000,
                startDate: '2025-09-15',
                loanStatusName: 'Overdue',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              },
              {
                id: 13,
                loanAmount: 1000000,
                startDate: '2025-09-22',
                loanStatusName: 'Up to Date',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              },
              {
                id: 2,
                loanAmount: 1000000,
                startDate: '2025-09-14',
                loanStatusName: 'Up to Date',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              }
            ],
            numberOfRefinancedLoans: 1,
            refinancedLoansTotalAmount: 200000,
            refinancedLoansDetails: [
              {
                id: 11,
                loanAmount: 200000,
                startDate: '2025-09-15',
                loanStatusName: 'Refinanced',
                creditTypeName: 'fixed_fees',
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                customerAddress: 'Calle 100 #50-60',
                customerPhone: '3005556666',
                interestRateValue: 10,
                penaltyRateValue: 0.05
              }
            ]
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de fecha inválidos',
    examples: {
      'invalid-date-format': {
        summary: 'Formato de fecha inválido',
        value: {
          statusCode: 400,
          message: [
            'startDate debe tener formato YYYY-MM-DD',
            'endDate debe ser posterior a startDate'
          ],
          error: 'Bad Request'
        }
      },
      'date-range-error': {
        summary: 'Rango de fechas inválido',
        value: {
          statusCode: 400,
          message: 'El rango de fechas no puede ser mayor a 1 año',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron datos en el rango de fechas',
    examples: {
      'no-data': {
        summary: 'No hay datos en el período',  
        value: {
          statusCode: 404,
          message: 'No se encontraron préstamos en el rango de fechas proporcionado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Sin permisos para ver reportes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver reportes',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los reportes',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al generar el reporte',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async getLoanValuesSummary(@Query() dto: DateRangeDto): Promise<ReportLoanSummaryResponse> {
    const loansSummaryRaw = await this.reportsService.getLoanValuesSummary(dto);
    const loansSummary = plainToInstance(ResponseLoanSummaryReportDto, loansSummaryRaw);
    return {
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      loansSummary,
    };
  }

  @Get('export/:reportType/:format')
  @Permissions('export.reports')
  @ApiOperation({
    summary: 'Exportar cualquier reporte en formato específico',
    description: 'Genera y descarga un reporte dinámicamente según el tipo y formato solicitados. Formatos disponibles: Excel (.xlsx) y PDF (.pdf)',
  })
  @ApiParam({ 
    name: 'reportType', 
    enum: ['loans-summary'], 
    description: 'Tipo de reporte a exportar',
    example: 'loans-summary'
  })
  @ApiParam({ 
    name: 'format', 
    enum: ['xlsx', 'pdf'], 
    description: 'Formato de archivo deseado',
    example: 'xlsx'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    example: '2025-01-01',
    description: 'Fecha de inicio (Formato YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    example: '2025-12-31',
    description: 'Fecha de fin (Formato YYYY-MM-DD)',
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf')
  @ApiOkResponse({
    description: 'Archivo exportado exitosamente',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel con el reporte de préstamos'
        },
        examples: {
          'excel-export': {
            summary: 'Exportación a Excel',
            description: 'Archivo Excel (.xlsx) con datos de préstamos nuevos y refinanciados',
            value: 'Binary Excel file content with loans data'
          },
          'pdf-export': {
            summary: 'Exportación a PDF',
            description: 'Archivo PDF con datos de préstamos nuevos y refinanciados',
            value: 'Binary PDF file content with loans data'
          }
        }
      },
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',  
          description: 'Archivo PDF con el reporte de préstamos'
        },
        examples: {
          'pdf-export': {
            summary: 'Exportación a PDF',
            description: 'Documento PDF con reporte formateado de préstamos nuevos y refinanciados',
            value: 'Binary PDF file content with formatted loans report'
          }
        }
      }
    },
    headers: {
      'Content-Type': {
        description: 'Tipo de contenido del archivo exportado',
        schema: {
          type: 'string',
          examples: {
            'excel': {
              summary: 'Tipo MIME para Excel',
              value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            'pdf': {
              summary: 'Tipo MIME para PDF',
              value: 'application/pdf'
            }
          }
        }
      },
      'Content-Disposition': {
        description: 'Información de descarga del archivo',
        schema: {
          type: 'string',
          examples: {
            'excel-filename': {
              summary: 'Nombre de archivo Excel',
              value: 'attachment; filename="loans-summary.xlsx"'
            },
            'pdf-filename': {
              summary: 'Nombre de archivo PDF',
              value: 'attachment; filename="loans-summary.pdf"'
            }
          }
        }
      },
      'Content-Length': {
        description: 'Tamaño del archivo en bytes',
        schema: {
          type: 'string',
          example: '524288'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros inválidos',
    examples: {
      'invalid-report-type': {
        summary: 'Tipo de reporte inválido',
        value: {
          statusCode: 400,
          message: 'Tipo de reporte no válido. Tipos disponibles: loans-summary',
          error: 'Bad Request'
        }
      },
      'invalid-format': {
        summary: 'Formato inválido',
        value: {
          statusCode: 400,
          message: 'Formato no válido. Formatos disponibles: xlsx, pdf',
          error: 'Bad Request'
        }
      },
      'invalid-date-range': {
        summary: 'Rango de fechas inválido',
        value: {
          statusCode: 400,
          message: [
            'startDate debe tener formato YYYY-MM-DD',
            'endDate debe ser posterior a startDate',
            'El rango de fechas no puede ser mayor a 1 año'
          ],
          error: 'Bad Request'
        }
      },
      'empty-date-range': {
        summary: 'Rango de fechas vacío',
        value: {
          statusCode: 400,
          message: 'No se pueden generar reportes con rangos de fechas vacíos',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron datos para exportar',
    examples: {
      'no-data-to-export': {
        summary: 'Sin datos para exportar',
        value: {
          statusCode: 404,
          message: 'No se encontraron préstamos para exportar en el rango de fechas especificado',
          error: 'Not Found'
        }
      },
      'empty-report': {
        summary: 'Reporte vacío',
        value: {
          statusCode: 404,
          message: 'El reporte no contiene datos suficientes para generar el archivo',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Sin permisos para exportar reportes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para exportar reportes',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para exportar reportes',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'export-error': {
        summary: 'Error al generar archivo',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al generar el archivo de exportación',
          error: 'Internal Server Error'
        }
      },
      'file-creation-error': {
        summary: 'Error al crear archivo Excel',
        value: {
          statusCode: 500,
          message: 'Error al generar el archivo Excel. Intente nuevamente',
          error: 'Internal Server Error'
        }
      },
      'pdf-generation-error': {
        summary: 'Error al crear archivo PDF',
        value: {
          statusCode: 500,
          message: 'Error al generar el archivo PDF. Intente nuevamente',
          error: 'Internal Server Error'
        }
      },
      'memory-error': {
        summary: 'Error de memoria insuficiente',
        value: {
          statusCode: 500,
          message: 'Memoria insuficiente para procesar el reporte. Reduzca el rango de fechas',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async exportReport(
    @Param('reportType') reportType: string,
    @Param('format') format: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ): Promise<void> {
    const fileBuffer = await this.reportsExporterService.exportReport(reportType, format, dto);

    // Configurar los encabezados de la respuesta para la descarga
    res.set({
      'Content-Type': format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportType}.${format}"`,
    });

    res.send(fileBuffer);
  }
}