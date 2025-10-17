import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportExporterService } from './reports-exporter.service';
import { ReportLoanService } from './reports-loans.service';
import { ReportCollectionService } from './reports-collections.service';
import { ReportRegistry } from './registry/reports.registry';
import { ReportsGateway } from './reports.gateway';
import { CollectionsReportHandler } from './handlers/collections-report.handler';
import { RedisModule } from '@infraestructure/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportExporterService,
    ReportLoanService,
    ReportCollectionService,
    ReportRegistry,
    ReportsGateway,
    CollectionsReportHandler,
  ],
  exports: [
    ReportsService,
    ReportExporterService,
    ReportLoanService,
    ReportCollectionService,
    ReportRegistry,
    ReportsGateway,
  ],
})
export class ReportsModule {}
