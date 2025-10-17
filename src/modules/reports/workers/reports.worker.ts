import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { ReportRegistry } from '../registry/reports.registry';
import { ReportsGateway } from '../reports.gateway';
import { REDIS_CLIENT } from '@infraestructure/redis/client';
import Redis from 'ioredis';

@Injectable()
export class ReportsWorker implements OnModuleInit {
  private readonly logger = new Logger(ReportsWorker.name);
  private readonly maxProcessingAttempts = 3;

  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly reportRegistry: ReportRegistry,
    private readonly reportsGateway: ReportsGateway,
    @Inject(REDIS_CLIENT) private readonly redis: Redis, // <-- Inyectamos Redis
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

  private async processReportWithRetry(reportName: string, params: any, attempt = 1) {
    try {
      await this.generateReport(reportName, params);
    } catch (error) {
      this.logger.error(`❌ Error generando reporte ${reportName} (intento ${attempt}):`, error);
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

    // ✅ Revisar cache directamente en Redis
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      this.logger.log(`Reporte encontrado en cache: ${cacheKey}`);
      this.reportsGateway.emitReport(reportName, parsed);
      return parsed;
    }

    const handler = this.reportRegistry.getHandler(reportName);
    if (!handler) {
      this.logger.error(`No existe handler para el reporte: ${reportName}`);
      throw new Error(`No handler found for report: ${reportName}`);
    }

    const result = await handler.execute(params);

    // Guardar en Redis TTL 30 minutos (1800 seg)
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    this.logger.log(`Reporte generado y cacheado: ${cacheKey}`);

    this.reportsGateway.emitReport(reportName, result);
    return result;
  }
}
