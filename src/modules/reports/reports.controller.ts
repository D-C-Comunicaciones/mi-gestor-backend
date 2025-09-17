import { Controller, Get, Query, Res, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiExtraModels, ApiParam } from '@nestjs/swagger';
import { Permissions } from '@auth/decorators';
import { ReportsService } from './reports.service';
import { DateRangeDto } from '@common/dto';
import { ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto } from './dto';
import { ReportLoanSummaryResponse } from './interfaces';
import { Response } from 'express';
import { ReportsExporterService } from './reports-exporter.service'; // 👈 Nuevo import
import { plainToInstance } from 'class-transformer';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanSummaryReportDto, LoanSummaryReportDetailDto)
@Controller('reports')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExporterService: ReportsExporterService // 👈 Inyección del nuevo servicio
  ) { }

  @Get('loans-summary')
  @Permissions('view.reports')
  @ApiOperation({
    summary: 'Obtener el valor total y conteo de créditos y refinanciados',
    description: 'Retorna la suma y el número de créditos nuevos y refinanciados en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
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
    type: ResponseLoanSummaryReportDto,
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron datos en el rango de fechas proporcionado',
  })
  async getLoanValuesSummary(@Query() dto: DateRangeDto): Promise<ReportLoanSummaryResponse> {
    const loansSummaryRaw = await this.reportsService.getLoanValuesSummary(dto);
    const loansSummary = plainToInstance(ResponseLoanSummaryReportDto, loansSummaryRaw);
    return {
      customMessage: 'Resumen de valores de créditos obtenido exitosamente',
      loansSummary,
    };
  }

  // ✅ Nuevo endpoint dinámico para exportar reportes
  @Get('export/:reportType/:format')
  @Permissions('export.reports')
  @ApiOperation({
    summary: 'Exportar un reporte en un formato específico',
    description: 'Genera y descarga un reporte dinámicamente según el tipo y formato solicitados.',
  })
  @ApiParam({ name: 'reportType', enum: ['loans-summary'], description: 'El tipo de reporte a exportar.' })
  @ApiParam({ name: 'format', enum: ['xlsx', 'pdf'], description: 'El formato de archivo deseado.' })
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