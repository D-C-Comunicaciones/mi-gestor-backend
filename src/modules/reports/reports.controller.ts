import { Controller, Get, Query, Res, Param, UseGuards, BadRequestException, Logger, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiExtraModels, ApiParam, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiProduces } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { DateRangeDto } from '@common/dto';
import { ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto, InterestReportPaginationDto, ResponseCollectionReportDto } from './dto';
import { NewLoansInterestReportResponse, ReportLoanSummaryResponse, CollectionReportResponse } from './interfaces';
import { Response } from 'express';
import { ReportExporterService } from './reports-exporter.service';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ReportCollectionService } from './reports-collections.service';
import { ReportLoanService } from './reports-loans.service';
import { ApiExportReport } from '@common/decorators';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('reports')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  constructor(
    private readonly reportsExporterService: ReportExporterService,
    private readonly reportsCollectionsService: ReportCollectionService,
    private readonly reportLoanService: ReportLoanService,
  ) { }

  @Get('loans-report')
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
    const loansSummaryRaw = await this.reportLoanService.getLoanData(dto);
    const loansSummary = plainToInstance(ResponseLoanSummaryReportDto, loansSummaryRaw);
    return {
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      loansSummary,
    };
  }

  @Get('export/:reportType/:format')
  @Permissions('export.reports')
  @ApiExportReport({
    reportTypes: ['loans-report', 'interest-summary', 'collections-report'],
    formats: ['xlsx', 'pdf']
  })
  async exportReport(
    @Param('reportType') reportType: string,
    @Param('format') format: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ): Promise<any> {

    const validFormats = ['xlsx', 'pdf'];

    if (!validFormats.includes(format)) {
      return res.status(400).json({
        statusCode: 400,
        message: `Formato "${format}" no válido. Formatos disponibles: ${validFormats.join(', ')}`,
        error: 'Bad Request'
      });
    }

    // Configuración de cada reporte
    const reportConfigs: Record<string, {
      fetchData: (dto: DateRangeDto) => Promise<any>,
      validateData: (data: any) => boolean,
      generateExcel: (data: any) => Promise<Buffer>,
      generatePdf: (data: any) => Promise<Buffer>,
      filename?: string
    }> = {
      'loans-report': {
        fetchData: (dto) => this.reportLoanService.getLoanData(dto),
        validateData: (data) => ((data.numberOfNewLoans || 0) > 0) || ((data.numberOfRefinancedLoans || 0) > 0),
        generateExcel: (data) => this.reportsExporterService.generateLoanReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateLoanReportPdf(data),
        filename: 'loans-report'
      },
      'collections-report': {
        fetchData: (dto) => this.reportsCollectionsService.getCollectionsReportData(dto),
        validateData: (data) => data.collections && data.collections.length > 0,
        generateExcel: (data) => this.reportsExporterService.generateCollectionReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateCollectionReportPdf(data),
        filename: 'collections-report'
      },
      // 'interest-summary': { ... } agregar cuando sea necesario
    };

    const config = reportConfigs[reportType];

    if (!config) {
      return res.status(400).json({
        statusCode: 400,
        message: `Tipo de reporte "${reportType}" no válido o no implementado. Tipos disponibles: ${Object.keys(reportConfigs).join(', ')}`,
        error: 'Bad Request'
      });
    }

    try {
      const reportData = await config.fetchData(dto);

      if (!config.validateData(reportData)) {
        return res.status(404).json({
          statusCode: 404,
          message: `No se encontraron datos para exportar para el reporte "${reportType}" en el período especificado`,
          error: 'Not Found'
        });
      }

      const fileBuffer = format === 'xlsx'
        ? await config.generateExcel(reportData)
        : await config.generatePdf(reportData);

      const filename = config.filename || reportType;

      res.set({
        'Content-Type': format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      });

      res.send(fileBuffer);

    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: `Error al generar el reporte: ${error.message}`,
        error: 'Internal Server Error'
      });
    }
  }

  @Get('collections-report/debug')
  @Permissions('view.reports')
  async getCollectionsReportDebug(@Query() dto: DateRangeDto) {
    const reportData = await this.reportsCollectionsService.getCollectionsReportData(dto);

    // Retornar solo la información de depuración
    return {
      message: 'Debug del reporte de cobros',
      totalCollectorRouteAssignments: reportData.collectorSummary.length,
      uniqueCollectors: new Set(reportData.collectorSummary.map(c => c.collectorId)).size,
      sampleData: reportData.collectorSummary.slice(0, 5).map(c => ({
        collectorId: c.collectorId,
        collectorName: c.collectorName,
        collectorRoute: c.collectorRoute,
        collectorRouteId: c.collectorRouteId,
        totalAssigned: c.totalAssigned,
        totalCollected: c.totalCollected,
        performancePercentage: c.performancePercentage,
        totalCollectionsMade: c.totalCollectionsMade
      })),
      expectedFrontendStructure: {
        note: "El frontend debe usar 'collectorRoute' para mostrar el nombre de la ruta, NO 'zoneName'",
        correctField: "collectorRoute",
        incorrectField: "zoneName (obsoleto)"
      }
    };
  }

  @Get('loans/summary')
  @Permissions('view.reports')
  @ApiOperation({ summary: 'Obtener resumen de créditos nuevos y refinanciados' })
  async getLoansSummary(@Query() dto: DateRangeDto) {
    const data = await this.reportLoanService.getLoanData(dto);
    return {
      message: 'Resumen de créditos obtenido correctamente',
      code: 200,
      status: 'success',
      data,
    };
  }
}