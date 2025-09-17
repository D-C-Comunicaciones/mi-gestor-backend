import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ReportsExporterService } from './reports-exporter.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExporterService],
})
export class ReportsModule {}