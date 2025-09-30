import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ReportsExporterService } from './reports-exporter.service';
import { ReportsCollectionsService } from './reports-collections.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportsController],
  providers: [
    ReportsService, 
    ReportsExporterService,
    ReportsCollectionsService,
  ],
})
export class ReportsModule {}