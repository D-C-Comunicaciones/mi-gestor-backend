import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportExporterService } from './reports-exporter.service';
import { ReportLoanService } from './reports-loans.service';
import { ReportCollectionService } from './reports-collections.service';
import { ReportRegistry } from './registry/reports.registry';
import { ReportsCache } from './caché/reports.cache';
import { ReportsGateway } from './reports.gateway';
import { CollectionsReportHandler } from './handlers/collections-report.handler';
// Si hay otros handlers, importarlos aquí
// import { LoansReportHandler } from './handlers/loans-report.handler';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportExporterService,
    ReportLoanService,
    ReportCollectionService,
    ReportRegistry,
    ReportsCache,
    ReportsGateway,
    CollectionsReportHandler,
    // LoansReportHandler, etc.
  ],
  exports: [
    ReportsService,
    ReportExporterService,
    ReportLoanService,
    ReportCollectionService,
    ReportRegistry,
    ReportsCache,
    ReportsGateway,
  ],
})
export class ReportsModule {}
