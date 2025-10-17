import { Controller, Get, Query, Res, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { DateRangeDto } from '@common/dto';
import { Response } from 'express';
import { ReportExporterService } from './reports-exporter.service';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ReportCollectionService } from './reports-collections.service';
import { ReportLoanService } from './reports-loans.service';
import { SwaggerExportReport, SwaggerCollectionsReport, SwaggerLoansReport } from '@common/decorators/swagger';
import { LoanReportDetailDto, ResponseLoanReportDto } from './dto/response-loan-report.dto';
import { LoanReportResponse } from './interfaces';
import { ResponseCollectionReportDto } from './dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('reports')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanReportDto, LoanReportDetailDto)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExporterService: ReportExporterService,
    private readonly reportLoanService: ReportLoanService,
  ) { }

  @Get('loans-report')
  @Permissions('view.reports')
  @SwaggerLoansReport()
  async getLoansReport(@Query() dto: DateRangeDto): Promise<LoanReportResponse> {
    const loansReportRaw = await this.reportLoanService.getLoansReportData(dto);
    const loansReport = plainToInstance(ResponseLoanReportDto, loansReportRaw);
    return {
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      loansReport,
    };
  }

  @Get('collections-report')
  @Permissions('view.reports')
  @SwaggerCollectionsReport()
  async getCollectionsReport(
    @Query() dto: DateRangeDto
  ): Promise<{ customMessage: string; collectionsReport: ResponseCollectionReportDto }> {

    // Usamos el ReportsService pasando el nombre exacto del handler
    const collectionsReportRaw = await this.reportsService.getReport(
      'collections-report', // Debe coincidir con getName() del handler
      dto
    );

    const collectionsReport = plainToInstance(ResponseCollectionReportDto, collectionsReportRaw);

    return {
      customMessage: 'Resumen de valores de cobros obtenido exitosamente',
      collectionsReport,
    };
  }

  @Get('export/:reportType/:format')
  @Permissions('export.reports')
  @SwaggerExportReport({
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
        fetchData: (dto) => this.reportLoanService.getLoansReportData(dto),
        validateData: (data) => ((data.numberOfNewLoans || 0) > 0) || ((data.numberOfRefinancedLoans || 0) > 0),
        generateExcel: (data) => this.reportsExporterService.generateLoanReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateLoanReportPdf(data),
        filename: 'loans-report'
      },
      'collections-report': {
        fetchData: (dto) => this.reportsService.getReport('collections-report', dto),
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
}