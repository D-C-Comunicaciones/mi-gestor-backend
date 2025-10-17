import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { ReportRegistry } from '../registry/reports.registry';
import { ReportsCache } from '../caché/reports.cache';
import { ReportsGateway } from '../reports.gateway';
@Injectable()
export class ReportsWorker implements OnModuleInit {
  private readonly logger = new Logger(ReportsWorker.name);
  private readonly maxProcessingAttempts = 3;

  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly reportRegistry: ReportRegistry,
    private readonly reportsCache: ReportsCache,
    private readonly reportsGateway: ReportsGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Iniciando ReportsWorker...');
    await this.rabbitMqService.waitForConnection();
    await this.rabbitMqService.assertQueue('reports_queue');

    await this.rabbitMqService.consume(
      'reports_queue',
      async (msg, ack, nack) => {
        try {
          const content = msg.content?.toString() ?? '';
          this.logger.log(`📩 Mensaje recibido: ${content}`);
          const { reportName, params } = JSON.parse(content);

          if (!reportName) {
            this.logger.warn('⚠️ Mensaje inválido: falta reportName');
            return ack(); // descartar mensaje inválido
          }

          await this.processReportWithRetry(reportName, params);
          this.logger.log(`✅ Procesamiento finalizado para reporte=${reportName}`);
          ack(); // ✅ confirmamos el mensaje
        } catch (error) {
          this.logger.error('❌ Error procesando mensaje de reporte:', error);
          nack(true); // 🔄 reencolamos para reintento posterior
        }
      },
    );

    this.logger.log('✅ Consumo de mensajes iniciado en reports_queue');
  }

  private async processReportWithRetry(
    reportName: string,
    params: any,
    attempt = 1,
  ) {
    try {
      await this.generateReport(reportName, params);
    } catch (error) {
      this.logger.error(
        `❌ Error generando reporte ${reportName} (intento ${attempt}):`,
        error,
      );
      if (attempt < this.maxProcessingAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        await this.processReportWithRetry(reportName, params, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  private async generateReport(reportName: string, params: any) {
    const cacheKey = `${reportName}:${JSON.stringify(params)}`;
    const cachedData = this.reportsCache.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Reporte encontrado en cache: ${cacheKey}`);
      this.reportsGateway.emitReport(reportName, cachedData);
      return cachedData;
    }

    const handler = this.reportRegistry.getHandler(reportName);
    if (!handler) {
      this.logger.error(`No existe handler para el reporte: ${reportName}`);
      throw new Error(`No handler found for report: ${reportName}`);
    }

    const result = await handler.execute(params);
    this.reportsCache.set(cacheKey, result, 30 * 60); // TTL 30 min en segundos
    this.logger.log(`Reporte generado y cacheado: ${cacheKey}`);

    this.reportsGateway.emitReport(reportName, result);
    return result;
  }
}
