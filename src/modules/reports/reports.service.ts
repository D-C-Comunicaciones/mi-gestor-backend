import { Inject, Injectable, Logger } from '@nestjs/common';
import { ReportsGateway } from './reports.gateway';
import { ReportRegistry } from './registry/reports.registry';
import { ReportHandler } from './handlers/base-report.handler';
import { REDIS_CLIENT } from '@infraestructure/redis/client';
import Redis from 'ioredis';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutos

  constructor(
    private readonly reportRegistry: ReportRegistry,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reportsGateway: ReportsGateway,
  ) {}

  async getReport<TParams = any, TResult = any>(
    reportName: string,
    params?: TParams,
  ): Promise<TResult> {
    this.logger.log(`📊 Solicitando reporte: ${reportName}`);

    const cacheKey = this.buildCacheKey(reportName, params);

    // Revisar cache directamente en Redis
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as TResult;
      this.logger.log(`🗄️ Reporte obtenido desde cache: ${reportName}`);
      this.reportsGateway.emitReport(reportName, parsed);
      return parsed;
    }

    const handler: ReportHandler<TParams, TResult> | null =
      this.reportRegistry.getHandler(reportName) as any;

    if (!handler) {
      this.logger.warn(`❌ No se encontró handler para el reporte: ${reportName}`);
      throw new Error(`Handler no registrado para reporte: ${reportName}`);
    }

    this.logger.log(`⚡ Generando reporte: ${reportName}`);
    const result = await handler.execute(params);

    // ✅ Validar que haya datos antes de cachear
    if (!result || this.isReportEmpty(result)) {
      this.logger.log(`Reporte vacío, no se cachea: ${reportName}`);
      throw new Error(`No se encontraron datos para exportar para el reporte "${reportName}" en el período especificado`);
    }

    // Guardar en Redis TTL 30 minutos (1800 seg)
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', this.cacheTTL / 1000);
    this.logger.log(`✅ Reporte cacheado por 30 minutos: ${reportName}`);

    this.reportsGateway.emitReport(reportName, result);

    return result;
  }

  private buildCacheKey(reportName: string, params?: any): string {
    if (!params) return reportName;
    return `${reportName}:${JSON.stringify(params)}`;
  }

  private isReportEmpty(report: any): boolean {
    // Ajusta según la estructura de tus reportes
    // Para collections-report
    if (report.summary && report.summary.totalCollections === 0) {
      return true;
    }
    // Agrega otras validaciones si hay más tipos de reportes
    return false;
  }

  getAvailableReports(): string[] {
    return this.reportRegistry.getAvailableReports();
  }
}
