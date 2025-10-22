import { Controller, Get, Query, Res, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { DateRangeDto } from '@common/dto';
import { Response } from 'express';
import { ReportExporterService } from './reports-exporter.service';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { SwaggerExportReport, SwaggerCollectionsReport, SwaggerLoansReport } from '@common/decorators/swagger';
import { LoanReportDetailDto, ResponseLoanReportDto } from './dto/response-loan-report.dto';
import { LoanReportResponse } from './interfaces';
import { ResponseCollectionReportDto, ResponseMoratoryInterestReportDto } from './dto';
import { ReportsService } from './reports.service';
import { reportTypesData } from './report-types';
import { reportFormatsData } from './report-formats';
import { SwaggerMoratoryInterestsReportDoc } from '@common/decorators/swagger/reports/moratory-interests-report-doc.decorator';

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
  ) { }

  @Get('loans-report')
  @Permissions('view.reports')
  @SwaggerLoansReport()
  async getLoansReport(@Query() dto: DateRangeDto) {
    const loansReportRaw = await this.reportsService.getReport('loans-report', dto);

    // 🔹 Validar si el reporte viene vacío
    if (
      loansReportRaw &&
      typeof loansReportRaw === 'object' &&
      'code' in loansReportRaw &&
      loansReportRaw.code === 204
    ) {
      return {
        code: 200,
        status: 'success',
        customMessage: loansReportRaw.message, // mensaje "No se encontraron datos..."
      };
    }

    const loansReport = plainToInstance(ResponseLoanReportDto, loansReportRaw);

    return {
      code: 200,
      status: 'success',
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      data: {
        loansReport,
      },
    };
  }

  @Get('collections-report')
  @Permissions('view.reports')
  @SwaggerCollectionsReport()
  async getCollectionsReport(@Query() dto: DateRangeDto) {
    const collectionsReportRaw = await this.reportsService.getReport(
      'collections-report',
      dto,
    );

    // 🔹 Validar si el reporte viene vacío
    if (
      collectionsReportRaw &&
      typeof collectionsReportRaw === 'object' &&
      'code' in collectionsReportRaw &&
      collectionsReportRaw.code === 204
    ) {
      return {
        code: 200,
        status: 'success',
        customMessage: collectionsReportRaw.message, // mensaje "No se encontraron datos..."
      };
    }

    const collectionsReport = plainToInstance(
      ResponseCollectionReportDto,
      collectionsReportRaw,
    );

    return {
      code: 200,
      status: 'success',
      customMessage: 'Resumen de valores de cobros obtenido exitosamente',
      data: {
        collectionsReport,
      },
    };
  }

  @Get('moratory-interests-report')
  @Permissions('view.reports')
  @SwaggerMoratoryInterestsReportDoc()
  async getInterestReport(@Query() dto: DateRangeDto) {
    const moratoryInterestReportRaw = await this.reportsService.getReport(
      'moratory-interests-report',
      dto,
    );

    // 🔹 Si el reporte devuelve objeto "sin datos"
    if (
      moratoryInterestReportRaw &&
      typeof moratoryInterestReportRaw === 'object' &&
      'code' in moratoryInterestReportRaw &&
      moratoryInterestReportRaw.code === 204
    ) {
      return {
        customMessage: moratoryInterestReportRaw.message, // usar el mensaje "No se encontraron datos..."
      };
    }

    // 🔹 Si sí trae datos válidos
    const moratoryInterestReport = plainToInstance(
      ResponseMoratoryInterestReportDto,
      moratoryInterestReportRaw,
    );

    return {
      code: 200,
      status: 'success',
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      data: {
        moratoryInterestReport,
      },
    };
  }


  @Get('export/:reportType/:format')
  @Permissions('export.reports')
  @SwaggerExportReport({
    reportTypes: ['loans-report', 'interest-summary', 'collections-report', 'moratory-interests-report'],
    formats: ['xlsx', 'pdf'],
  })
  async exportReport(
    @Param('reportType') reportType: string,
    @Param('format') format: string,
    @Query() dto: DateRangeDto,
    @Res() res: Response,
  ): Promise<any> {

    // Valid formats provienen de reportFormatsData
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
        fetchData: (dto) => this.reportsService.getReport('loans-report', dto),
        validateData: (data) => ((data.numberOfNewLoans || 0) > 0) || ((data.numberOfRefinancedLoans || 0) > 0),
        generateExcel: (data) => this.reportsExporterService.generateLoanReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateLoanReportPdf(data),
        filename: 'loans-report'
      },
      'collections-report': {
        fetchData: (dto) => this.reportsService.getReport('collections-report', dto),
        validateData: (data) => data && data.collections && data.collections.length > 0,
        generateExcel: (data) => this.reportsExporterService.generateCollectionReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateCollectionReportPdf(data),
        filename: 'collections-report'
      },

      'moratory-interests-report': {
        fetchData: (dto) => this.reportsService.getReport('moratory-interests-report', dto),
        // Acepta:
        // - respuestas en forma de array (legacy)
        // - objetos con propiedad `data` que sea array (handler actual)
        validateData: (data) => {
          if (!data) return false;
          if (Array.isArray(data)) return data.length > 0;
          if (Array.isArray((data as any).data)) return (data as any).data.length > 0;
          return false;
        },
        generateExcel: (data) => this.reportsExporterService.generateMoratoryInterestsReportExcel(data),
        generatePdf: (data) => this.reportsExporterService.generateMoratoryInterestReportPdf(data),
        filename: 'moratory-interests-report'
      },
    };

    const config = reportConfigs[reportType];

    if (!config) {
      return res.status(400).json({
        customMmessage: `Tipo de reporte "${reportType}" no válido o no implementado. Tipos disponibles: ${Object.keys(reportConfigs).join(', ')}`,
      });
    }

    try {
      const reportData = await config.fetchData(dto);

      if (!config.validateData(reportData)) {
        return res.status(200).json({
          customMessage: `No se encontraron datos para exportar para el reporte "${reportType}" en el período especificado`,
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