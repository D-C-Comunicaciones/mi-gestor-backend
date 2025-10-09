import { envs } from '@config/envs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricService implements OnModuleInit {
  private readonly register: client.Registry;

  // Métricas personalizadas
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly activeRequests: client.Gauge<string>;
  private readonly dbQueryDuration: client.Histogram<string>;
  private readonly exampleCounter: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();

    // Prefijo configurable para todas las métricas
    const prefix = envs.metrics.prefix || 'migestor';

    // Métrica: duración de solicitudes HTTP
    this.httpRequestDuration = new client.Histogram({
      name: `${prefix}_http_request_duration_seconds`,
      help: 'Duración de las solicitudes HTTP en segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    // Métrica: solicitudes activas
    this.activeRequests = new client.Gauge({
      name: `${prefix}_http_active_requests`,
      help: 'Número de solicitudes HTTP actualmente en curso',
      registers: [this.register],
    });

    // Métrica: duración de consultas DB (útil si usas Prisma o TypeORM)
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
  }

  onModuleInit() {
    // Registrar métricas predeterminadas del proceso Node.js
    client.collectDefaultMetrics({
      register: this.register,
      prefix: envs.metrics.prefix,
    });

    // Incrementa el contador inicial
    this.exampleCounter.inc(1);
  }

  // ⏱️ Métodos auxiliares para usar desde otros módulos
  startHttpTimer() {
    return this.httpRequestDuration.startTimer();
  }

  incActiveRequests() {
    this.activeRequests.inc();
  }

  decActiveRequests() {
    this.activeRequests.dec();
  }

  observeDbQuery(operation: string, table: string, durationSeconds: number) {
    this.dbQueryDuration.observe({ operation, table }, durationSeconds);
  }

  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  getRegistry(): client.Registry {
    return this.register;
  }
}
