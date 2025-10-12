import { envs } from '@config/envs';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricService implements OnModuleInit {
  private readonly register: client.Registry;
  private readonly logger = new Logger(MetricService.name);

  // Métricas personalizadas
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly activeRequests: client.Gauge<string>;
  private readonly dbQueryDuration: client.Histogram<string>;
  private readonly exampleCounter: client.Counter<string>;

  // 🔒 WeakMap para prevenir decrementos múltiples por request
  private readonly activeRequestsMap = new WeakMap<any, boolean>();

  constructor() {
    this.logger.log('🔄 Constructor de MetricService llamado');
    
    this.register = new client.Registry();
    const prefix = envs.metrics.prefix;
    this.logger.log(`📊 Prefijo de métricas: ${prefix}`);

    // Duración solicitudes HTTP
    this.httpRequestDuration = new client.Histogram({
      name: `${prefix}_http_request_duration_seconds`,
      help: 'Duración de las solicitudes HTTP en segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    // Solicitudes activas
    this.activeRequests = new client.Gauge({
      name: `${prefix}_http_active_requests`,
      help: 'Número de solicitudes HTTP actualmente en curso',
      registers: [this.register],
    });

    // Duración consultas DB
    this.dbQueryDuration = new client.Histogram({
      name: `${prefix}_db_query_duration_seconds`,
      help: 'Duración de las consultas a la base de datos en segundos',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5],
      registers: [this.register],
    });

    // Contador de ejemplo
    this.exampleCounter = new client.Counter({
      name: `${prefix}_example_counter_total`,
      help: 'Contador de ejemplo para probar métricas personalizadas',
      registers: [this.register],
    });

    this.logger.log('🎯 Todas las métricas personalizadas han sido registradas');
  }

  onModuleInit() {
    this.logger.log('🚀 onModuleInit ejecutado - Registrando métricas default');

    client.collectDefaultMetrics({
      register: this.register,
      prefix: envs.metrics.prefix + '_',
    });

    this.exampleCounter.inc(1);
    this.logger.log('🔢 exampleCounter incrementado a 1');
    this.logger.log('✅ Métricas default de Node.js registradas');
  }

  // ⏱️ Timer HTTP
  startHttpTimer() {
    const end = this.httpRequestDuration.startTimer();
    return (labels?: { method: string; route: string; status_code: number }) => {
      try {
        end(labels);
      } catch (error) {
        this.logger.error('❌ Error registrando httpRequestDuration', error.message);
      }
    };
  }

  // 📈 Incrementar requests activas
  incActiveRequests(res?: any) {
    try {
      this.activeRequests.inc();
      if (res) this.activeRequestsMap.set(res, true);
      this.logger.debug('📈 activeRequests incrementado');
    } catch (error) {
      this.logger.error('❌ Error incrementando activeRequests: ' + error.message);
    }
  }

  // 📉 Decrementar requests activas (protegido contra doble decremento)
  decActiveRequests(res?: any) {
    try {
      if (res) {
        const canDecrement = this.activeRequestsMap.get(res);
        if (!canDecrement) {
          this.logger.debug('⚠️ activeRequests ya decrementado para esta request');
          return;
        }
        this.activeRequestsMap.set(res, false);
      }
      this.activeRequests.dec();
      this.logger.debug('📉 activeRequests decrementado');
    } catch (error) {
      this.logger.error('❌ Error decrementando activeRequests: ' + error.message);
    }
  }

  // 🗃️ Métrica duración DB
  observeDbQuery(operation: string, table: string, durationSeconds: number) {
    try {
      this.dbQueryDuration.observe({ operation, table }, durationSeconds);
    } catch (error) {
      this.logger.error(`❌ Error en observeDbQuery: ${error.message}`);
    }
  }

  // 🌐 Métrica duración HTTP
  observeHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    try {
      this.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        durationSeconds
      );
    } catch (error) {
      this.logger.error(`❌ Error en observeHttpRequest: ${error.message}`);
    }
  }

  // 📡 Obtener métricas en formato Prometheus
  async getMetrics(): Promise<string> {
    try {
      const metrics = await this.register.metrics();
      return metrics;
    } catch (error) {
      this.logger.error('❌ Error obteniendo métricas: ' + error.message);
      throw error;
    }
  }

  getRegistry(): client.Registry {
    return this.register;
  }
}
