import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ReportExporterService } from './reports-exporter.service';
import { ReportCollectionService } from './reports-collections.service';
import { ReportLoanService } from './reports-loans.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportsController],
  providers: [
    ReportExporterService,
    ReportCollectionService,
    ReportLoanService
  ],
})
export class ReportsModule {}