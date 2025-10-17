import { Injectable, Logger } from '@nestjs/common';
import { ReportsGateway } from './reports.gateway';
import { ReportRegistry } from './registry/reports.registry';
import { ReportsCache } from './caché/reports.cache';
import { ReportHandler } from './handlers/base-report.handler';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    private readonly cacheTTL = 30 * 60 * 1000; // 30 minutos

    constructor(
        private readonly reportRegistry: ReportRegistry,
        private readonly reportsCache: ReportsCache,
        private readonly reportsGateway: ReportsGateway,
    ) { }

    async getReport<TParams = any, TResult = any>(
        reportName: string,
        params?: TParams,
    ): Promise<TResult> {
        this.logger.log(`📊 Solicitando reporte: ${reportName}`);

        const cacheKey = this.buildCacheKey(reportName, params);
        const cached = await this.reportsCache.get<TResult>(cacheKey);

        if (cached) {
            this.logger.log(`🗄️ Reporte obtenido desde cache: ${reportName}`);
            this.reportsGateway.emitReport(reportName, cached);
            return cached;
        }

        const handler: ReportHandler<TParams, TResult> | null =
            this.reportRegistry.getHandler(reportName) as any;

        if (!handler) {
            this.logger.warn(`❌ No se encontró handler para el reporte: ${reportName}`);
            throw new Error(`Handler no registrado para reporte: ${reportName}`);
        }

        this.logger.log(`⚡ Generando reporte: ${reportName}`);
        const result = await handler.execute(params);

        await this.reportsCache.set(cacheKey, result, this.cacheTTL);
        this.logger.log(`✅ Reporte cacheado por 30 minutos: ${reportName}`);

        this.reportsGateway.emitReport(reportName, result);

        return result;
    }

    private buildCacheKey(reportName: string, params?: any): string {
        if (!params) return reportName;
        return `${reportName}:${JSON.stringify(params)}`;
    }

    getAvailableReports(): string[] {
        return this.reportRegistry.getAvailableReports();
    }
}
