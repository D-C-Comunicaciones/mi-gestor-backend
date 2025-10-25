import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportExporterService } from './reports-exporter.service';
import { ReportRegistry } from './registry/reports.registry';
import { ReportsGateway } from './reports.gateway';
import { RedisModule } from '@infraestructure/redis/redis.module';
import { LoanReportHandler, CollectionReportHandler, MoratoryInterestReportHandler, InterestsReportHandler } from './handlers';
import {  } from './handlers/interests-report.handler';

@Module({
  imports: [
    RedisModule
  ],
  controllers: [
    ReportsController
  ],
  providers: [
    ReportsService,
    ReportExporterService,
    ReportRegistry,
    ReportsGateway,
    LoanReportHandler,
    CollectionReportHandler,
    MoratoryInterestReportHandler,
    InterestsReportHandler,
  ],
  exports: [
    ReportsService,
    ReportExporterService,
    ReportRegistry,
    ReportsGateway,
  ],
})
export class ReportsModule {}
