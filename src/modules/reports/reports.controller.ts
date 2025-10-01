import { Controller, Get, Query, Res, Param, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiExtraModels, ApiParam, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiProduces } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { ReportsService } from './reports.service';
import { DateRangeDto } from '@common/dto';
import { ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto, InterestReportPaginationDto, ResponseCollectionReportDto } from './dto';
import { NewLoansInterestReportResponse, ReportLoanSummaryResponse, CollectionReportResponse } from './interfaces';
import { Response } from 'express';
import { ReportsExporterService } from './reports-exporter.service';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ReportsCollectionsService } from './reports-collections.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('reports')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExporterService: ReportsExporterService,
    private readonly reportsCollectionsService: ReportsCollectionsService,
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
    enum: ['loans-summary', 'interest-summary', 'collections-report'],
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
    let fileBuffer: Buffer;

    // Validar tipo de reporte y formato
    const validReportTypes = ['loans-summary', 'interest-summary', 'collections-report'];
    const validFormats = ['xlsx', 'pdf'];

    if (!validReportTypes.includes(reportType)) {
      res.status(400).json({
        statusCode: 400,
        message: `Tipo de reporte "${reportType}" no válido. Tipos disponibles: ${validReportTypes.join(', ')}`,
        error: 'Bad Request'
      });
      return;
    }

    if (!validFormats.includes(format)) {
      res.status(400).json({
        statusCode: 400,
        message: `Formato "${format}" no válido. Formatos disponibles: ${validFormats.join(', ')}`,
        error: 'Bad Request'
      });
      return;
    }

    try {
      let reportData: any;

      switch (reportType) {
        case 'loans-summary':
          reportData = await this.reportsService.getLoanValuesSummary(dto);
          
          // Validar si hay datos para exportar
          const hasNewLoans = (reportData.numberOfNewLoans || 0) > 0;
          const hasRefinancedLoans = (reportData.numberOfRefinancedLoans || 0) > 0;
          
          if (!hasNewLoans && !hasRefinancedLoans) {
            res.status(404).json({
              statusCode: 404,
              message: `No se encontraron préstamos para exportar en el período especificado`,
              error: 'Not Found'
            });
            return;
          }
          
          if (format === 'xlsx') {
            fileBuffer = await this.reportsExporterService.generateLoansExcel(reportData);
          } else {
            fileBuffer = await this.reportsExporterService.generateLoansPdf(reportData);
          }
          break;

        case 'interest-summary':
          reportData = await this.reportsService.getLoanInterestSummary({ ...dto, page: 1, limit: 99999999 });
          
          // Validar si hay datos de intereses
          const hasInterestData = (reportData.details && reportData.details.length > 0) || 
                                  (reportData.totalGeneralRecaudado && reportData.totalGeneralRecaudado > 0);
          
          if (!hasInterestData) {
            res.status(404).json({
              statusCode: 404,
              message: `No se encontraron datos de intereses para exportar en el período especificado`,
              error: 'Not Found'
            });
            return;
          }
          
          if (format === 'xlsx') {
            fileBuffer = await this.reportsExporterService.generateInterestReportExcel(reportData);
          } else {
            fileBuffer = await this.reportsExporterService.generateInterestReportPdf(reportData);
          }
          break;

        case 'collections-report':
          // Obtener datos del reporte directamente
          reportData = await this.reportsCollectionsService.getCollectionsReportData(dto);
          
          // Validar si hay datos para exportar
          if (!reportData.collections || reportData.collections.length === 0) {
            res.status(404).json({
              statusCode: 404,
              message: `No se encontraron recaudos para exportar en el período ${reportData.metadata.period}`,
              error: 'Not Found'
            });
            return;
          }
          
          if (format === 'xlsx') {
            fileBuffer = await this.reportsExporterService.generateCollectionReportExcel(reportData);
          } else {
            fileBuffer = await this.reportsExporterService.generateCollectionReportPdf(reportData);
          }
          break;

        default:
          res.status(400).json({
            statusCode: 400,
            message: `Tipo de reporte "${reportType}" no implementado`,
            error: 'Bad Request'
          });
          return;
      }

      // Configurar los encabezados de la respuesta para la descarga
      const contentType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${reportType}.${format}"`,
      });

      res.send(fileBuffer);

    } catch (error) {
      // Manejar errores específicos de "No se encontraron datos"
      if (error.message.includes('No se encontraron')) {
        res.status(404).json({
          statusCode: 404,
          message: error.message,
          error: 'Not Found'
        });
        return;
      }

      res.status(500).json({
        statusCode: 500,
        message: `Error al generar el reporte: ${error.message}`,
        error: 'Internal Server Error'
      });
    }
  }

  @Get('interest-summary')
  @Permissions('view.interest.reports')
  @ApiOperation({
    summary: 'Obtener reporte de intereses pagados por créditos con paginación',
    description: 'Retorna el total de intereses (normal y moratorio) pagados por créditos en un rango de fechas, con paginación y filtros. Los créditos se clasifican como Nuevos si su fecha de inicio está dentro del rango especificado. Incluye totales globales y detalle por crédito con sus cuotas e intereses recaudados.'
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01', description: 'Fecha de inicio (Formato YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31', description: 'Fecha de fin (Formato YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Número de página para paginación' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Límite de registros por página' })
  @ApiQuery({
    name: 'loanStatusName',
    required: false,
    example: 'Paid',
    description: 'Filtrar por estado específico del crédito',
    enum: ['Paid', 'Overdue', 'Pending', 'Refinanced', 'Created']
  })
  @ApiOkResponse({
    description: 'Reporte de intereses generado correctamente con paginación',
    examples: {
      'success': {
        summary: 'Reporte generado exitosamente',
        value: {
          customMessage: 'Resumen de intereses de créditos obtenido exitosamente',
          interestSummary: {
            grandTotals: {
              totalInterestRecaudado: 500000,
              totalMoratorioRecaudado: 75000,
              totalGeneralRecaudado: 575000,
              totalSaldoPendiente: 2500000,
              totalMoraPendiente: 150000,
              totalDeudaPendiente: 2650000
            },
            details: [
              {
                loanId: 2,
                customerName: 'Juan Pérez',
                customerDocument: 111222333,
                collectorName: 'Admin User',
                loanStatusName: 'Up to Date',
                paymentDate: '2025-09-23 14:12:43',
                appliedToInterest: 146763.32,
                appliedToLateFee: 0,
                appliedToCapital: 0,
                totalPaid: 146763.32,
                remainingBalance: 958.12,
                installmentStatus: {
                  paid: [
                    {
                      sequence: 1,
                      dueDate: '2025-09-15',
                      totalAmount: 146763.32,
                      paidAmount: 146763.32,
                      saldoPendiente: 0,
                      moratoryAmount: 0,
                      payments: [
                        {
                          paymentDate: '2025-09-23 14:12:43',
                          collectorName: 'Admin User',
                          appliedToInterest: 100000,
                          appliedToLateFee: 0,
                          appliedToCapital: 46763.32,
                          totalPaid: 146763.32
                        }
                      ]
                    }
                  ],
                  mora: [],
                  pendiente: [
                    {
                      sequence: 2,
                      dueDate: '2025-10-15',
                      totalAmount: 146763.32,
                      paidAmount: 0,
                      saldoPendiente: 146763.32,
                      moratoryAmount: 0,
                      payments: []
                    }
                  ]
                }
              }
            ],
            meta: {
              total: 1,
              page: 1,
              lastPage: 1,
              limit: 10,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      },
      'no-data': {
        summary: 'Sin datos en el período',
        value: {
          customMessage: 'Resumen de intereses de créditos obtenido exitosamente',
          interestSummary: {
            grandTotals: {
              totalInterestRecaudado: 0,
              totalMoratorioRecaudado: 0,
              totalGeneralRecaudado: 0,
              totalSaldoPendiente: 0,
              totalMoraPendiente: 0,
              totalDeudaPendiente: 0
            },
            details: [],
            meta: {
              total: 0,
              page: 1,
              lastPage: 0,
              limit: 10,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de fecha o paginación inválidos',
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
      'invalid-pagination': {
        summary: 'Parámetros de paginación inválidos',
        value: {
          statusCode: 400,
          message: [
            'page debe ser un número positivo',
            'limit debe estar entre 1 y 100'
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
      'no-loans-in-period': {
        summary: 'No hay préstamos en el período',
        value: {
          statusCode: 404,
          message: 'No se encontraron préstamos con pagos en el rango de fechas especificado',
          error: 'Not Found'
        }
      },
      'no-payments-found': {
        summary: 'No se encontraron pagos',
        value: {
          statusCode: 404,
          message: 'No se registraron pagos de intereses en el período especificado',
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
    description: 'Acceso prohibido - Sin permisos para ver reportes de intereses',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver reportes de intereses',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los reportes de intereses',
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
          message: 'Error interno del servidor al generar el reporte de intereses',
          error: 'Internal Server Error'
        }
      },
      'calculation-error': {
        summary: 'Error en cálculos de intereses',
        value: {
          statusCode: 500,
          message: 'Error al calcular los totales de intereses y moratorias',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async getLoanInterestSummary(@Query() dto: InterestReportPaginationDto): Promise<any> {
    const interestSummaryRaw = await this.reportsService.getLoanInterestSummary(dto);
    return {
      customMessage: 'Resumen de intereses de créditos obtenido exitosamente',
      interestSummary: interestSummaryRaw,
    };
  }

  // Retornar reporte de recaudos por cobrador en JSON  
  @Get('collections-report')
  @Permissions('view.reports')
  @ApiOperation({
    summary: 'Obtener reporte de recaudos por cobrador',
    description: 'Genera un reporte detallado de recaudos por cobrador con totales, promedios y detalle de cada recaudo. Por defecto muestra los últimos 30 días.'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha de inicio del reporte (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha de fin del reporte YYYY-MM-DD',
    example: '2024-01-31'
  })
  @ApiOkResponse({
    description: 'Reporte de recaudos obtenido exitosamente',
    examples: {
      'success': {
        summary: 'Reporte generado exitosamente',
        value: {
          customMessage: 'Reporte de recaudos generado correctamente',
          collectionReport: {
            summary: {
              totalCollections: 125,
              totalAmount: 15000000.00,
              activeCollectors: 5,
              uniqueCustomers: 85,
              averagePerCollector: 3000000.00,
              averagePerCustomer: 176470.59
            },
            collectorSummary: [
              {
                id: 1,
                name: 'Carlos Cobrador',
                documentNumber: '12345678',
                zoneName: 'Centro',
                totalCollections: 35,
                totalAmount: 5250000.00
              },
              {
                id: 2,
                name: 'Ana Cobradora',
                documentNumber: '87654321',
                zoneName: 'Norte',
                totalCollections: 28,
                totalAmount: 4200000.00
              }
            ],
            details: [
              {
                paymentId: 25,
                paymentDate: '2024-01-15 14:30:00',
                amount: 146763.32,
                customerName: 'Juan Pérez García',
                customerDocument: '87654321',
                collectorName: 'Carlos Cobrador',
                loanId: 2,
                zoneName: 'Centro'
              }
            ]
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron recaudos en el periodo',
    examples: {
      'no-data': {
        summary: 'Sin datos en el periodo',
        value: {
          statusCode: 404,
          message: 'No se encontraron recaudos en el periodo especificado.',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de fecha inválidos',
    examples: {
      'invalid-date-range': {
        summary: 'Rango de fechas inválido',
        value: {
          statusCode: 400,
          message: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permisos para ver reportes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos',
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
        summary: 'Error interno',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al generar el reporte',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async getCollectionReport(
    @Query() dateRangeDto: DateRangeDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<CollectionReportResponse> {
    try {
      // Obtener datos del reporte directamente
      const reportData = await this.reportsCollectionsService.getCollectionsReportData(dateRangeDto);

      // Validar si hay datos en el reporte
      if (!reportData.collections || reportData.collections.length === 0) {
        return {
          customMessage: `No se encontraron recaudos en el período ${reportData.metadata.period}`,
          collectionReport: []
        };
      }

      this.logger.log(`Generando reporte con ${reportData.collections.length} registros para el período ${reportData.metadata.period}`);

      const collectionReport = plainToInstance(ResponseCollectionReportDto, reportData, {
        excludeExtraneousValues: true,
      });

      return {
        customMessage: 'Reporte de recaudos generado correctamente',
        collectionReport,
      };

    } catch (error) {
      this.logger.error(`Error al generar reporte de recaudos: ${error.message}`);
      throw error;
    }
  }

  @Get('collection-report/export/:format')
  @Permissions('export.reports')
  @ApiOperation({
    summary: 'Exportar reporte de recaudos',
    description: 'Exporta el reporte de recaudos por cobrador en formato Excel o PDF con gráficas y tablas'
  })
  @ApiParam({
    name: 'format',
    enum: ['xlsx', 'pdf'],
    description: 'Formato de exportación',
    example: 'pdf'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha de inicio del reporte',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha de fin del reporte',
    example: '2024-01-31T23:59:59.999Z'
  })
  @ApiOkResponse({
    description: 'Archivo generado exitosamente',
    schema: {
      type: 'string',
      format: 'binary',
    },
    headers: {
      'Content-Disposition': {
        description: 'Nombre del archivo',
        schema: { type: 'string', example: 'attachment; filename="reporte-recaudos.pdf"' }
      },
      'Content-Type': {
        description: 'Tipo de contenido',
        schema: { type: 'string', example: 'application/pdf' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Formato no soportado',
    examples: {
      'invalid-format': {
        summary: 'Formato inválido',
        value: {
          statusCode: 400,
          message: 'Formato de exportación "doc" no soportado.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permisos para exportar reportes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para exportar reportes',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error al generar archivo',
    examples: {
      'export-error': {
        summary: 'Error en exportación',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al generar el archivo',
          error: 'Internal Server Error'
        }
      }
    }
  })
  /**
   * Genera reporte de recaudos (PDF o Excel)
   * Ejemplo:
   *   GET /reports/collections?startDate=2025-09-01&endDate=2025-09-29&format=pdf
   */
  @Get()
  async exportCollections(
    @Query() dto: DateRangeDto,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Res() res: Response,
  ) {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('Debes enviar startDate y endDate');
    }
    if (!['pdf', 'xlsx'].includes(format)) {
      throw new BadRequestException('Formato inválido, use pdf o xlsx');
    }

    try {
      // Obtener los datos del reporte directamente
      const reportData = await this.reportsCollectionsService.getCollectionsReportData(dto);
      
      // Validar si hay datos para exportar
      if (!reportData.collections || reportData.collections.length === 0) {
        res.status(404).json({
          statusCode: 404,
          message: `No se encontraron recaudos para exportar en el período ${reportData.metadata.period}`,
          error: 'Not Found'
        });
        return;
      }

      // Generar el archivo según el formato
      let buffer: Buffer;
      if (format === 'pdf') {
        buffer = await this.reportsExporterService.generateCollectionReportPdf(reportData);
      } else {
        buffer = await this.reportsExporterService.generateCollectionReportExcel(reportData);
      }

      res.setHeader(
        'Content-Type',
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename=collections-report.${format}`);
      res.send(buffer);

    } catch (error) {
      throw error;
    }
  }
}