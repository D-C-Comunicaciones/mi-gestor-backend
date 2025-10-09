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

  constructor() {
    this.logger.log('🔄 Constructor de MetricService llamado');
    
    this.register = new client.Registry();

    // Prefijo configurable para todas las métricas - SIN guion adicional
    const prefix = envs.metrics.prefix; // ← "migestor" sin guion
    this.logger.log(`📊 Prefijo de métricas: ${prefix}`);

    // Métrica: duración de solicitudes HTTP
    this.httpRequestDuration = new client.Histogram({
      name: `${prefix}_http_request_duration_seconds`, // ← El guion va aquí
      help: 'Duración de las solicitudes HTTP en segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.register],
    });
    this.logger.log('✅ Métrica httpRequestDuration registrada: ' + `${prefix}_http_request_duration_seconds`);

    // Métrica: solicitudes activas
    this.activeRequests = new client.Gauge({
      name: `${prefix}_http_active_requests`, // ← El guion va aquí
      help: 'Número de solicitudes HTTP actualmente en curso',
      registers: [this.register],
    });
    this.logger.log('✅ Métrica activeRequests registrada: ' + `${prefix}_http_active_requests`);

    // Métrica: duración de consultas DB (útil si usas Prisma o TypeORM)
    this.dbQueryDuration = new client.Histogram({
      name: `${prefix}_db_query_duration_seconds`, // ← El guion va aquí
      help: 'Duración de las consultas a la base de datos en segundos',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5],
      registers: [this.register],
    });
    this.logger.log('✅ Métrica dbQueryDuration registrada: ' + `${prefix}_db_query_duration_seconds`);

    // Contador de ejemplo
    this.exampleCounter = new client.Counter({
      name: `${prefix}_example_counter_total`, // ← El guion va aquí
      help: 'Contador de ejemplo para probar métricas personalizadas',
      registers: [this.register],
    });
    this.logger.log('✅ Métrica exampleCounter registrada: ' + `${prefix}_example_counter_total`);

    this.logger.log('🎯 Todas las métricas personalizadas han sido registradas');
  }

  onModuleInit() {
    this.logger.log('🚀 onModuleInit ejecutado - Registrando métricas default');
    
    // Registrar métricas predeterminadas del proceso Node.js
    client.collectDefaultMetrics({
      register: this.register,
      prefix: envs.metrics.prefix + '_',  // ← "migestor_" con guion
    });

    // Incrementa el contador inicial
    this.exampleCounter.inc(1);
    this.logger.log('🔢 exampleCounter incrementado a 1');

    this.logger.log('✅ Métricas default de Node.js registradas');
  }
  
  // ⏱️ Métodos auxiliares para usar desde otros módulos
  startHttpTimer() {
    this.logger.debug('⏱️ startHttpTimer llamado - Creando timer');
    
    const end = this.httpRequestDuration.startTimer();
    
    // Devolver una función wrapper con logging
    return (labels?: { method: string; route: string; status_code: number }) => {
      this.logger.debug(`⏱️ Timer finalizado - Registrando métrica:`, labels);
      const result = end(labels);
      this.logger.debug(`✅ Métrica registrada en histograma`);
      return result;
    };
  }

  incActiveRequests() {
    this.logger.debug('📈 incActiveRequests llamado - Incrementando requests activas');
    this.activeRequests.inc();
  }

  decActiveRequests() {
    this.logger.debug('📉 decActiveRequests llamado - Decrementando requests activas');
    this.activeRequests.dec();
  }

  observeDbQuery(operation: string, table: string, durationSeconds: number) {
    this.logger.debug(`🗃️ observeDbQuery llamado - ${operation} en ${table}: ${durationSeconds}s`);
    this.dbQueryDuration.observe({ operation, table }, durationSeconds);
  }

  async getMetrics(): Promise<string> {
    this.logger.log('📡 📡 📡 getMetrics LLAMADO - Iniciando...');
    
    try {
      // 👇 VERIFICAR qué hay en el registry ANTES de llamar a metrics()
      const metricNamesBefore = this.register.getMetricsAsArray().map(m => m.name);
      this.logger.log(`🔍 Métricas en registry ANTES de .metrics(): ${metricNamesBefore.length} métricas`);
      this.logger.log(`🔍 Lista:`, metricNamesBefore);
      
      // 👇 OBTENER las métricas
      this.logger.log(`🔍 Llamando a register.metrics()...`);
      const metrics = await this.register.metrics();
      this.logger.log(`✅ .metrics() ejecutado exitosamente`);
      
      // 👇 VERIFICAR el contenido COMPLETO
      this.logger.log(`📦 Longitud del response: ${metrics.length} caracteres`);
      this.logger.log(`📦 Primeros 1000 caracteres del response:`);
      this.logger.log(metrics.substring(0, 1000));
      
      // 👇 VERIFICAR qué métricas están en el response
      const metricLines = metrics.split('\n');
      this.logger.log(`📊 Total de líneas en response: ${metricLines.length}`);
      
      const migestorMetricsInResponse = metricLines.filter(line => 
        line.includes('migestor_') && (line.startsWith('# HELP') || line.startsWith('# TYPE'))
      );
      this.logger.log(`🔍 Métricas migestor_ en response: ${migestorMetricsInResponse.length}`);
      
      if (migestorMetricsInResponse.length > 0) {
        this.logger.log('🔍 Primeras 5 métricas migestor_ encontradas:');
        migestorMetricsInResponse.slice(0, 5).forEach(metric => {
          this.logger.log('   ' + metric.substring(0, 150)); // Primeros 150 chars
        });
      } else {
        this.logger.warn('⚠️  NO se encontraron métricas migestor_ en el response');
        
        // Verificar qué SÍ hay en el response
        const otherMetrics = metricLines.filter(line => 
          (line.startsWith('# HELP') || line.startsWith('# TYPE')) && !line.includes('migestor_')
        );
        this.logger.log(`🔍 Otras métricas encontradas en response: ${otherMetrics.length}`);
        if (otherMetrics.length > 0) {
          this.logger.log('🔍 Primeras 5 otras métricas:');
          otherMetrics.slice(0, 5).forEach(metric => {
            this.logger.log('   ' + metric.substring(0, 150));
          });
        }
      }
      
      this.logger.log(`🎯 getMetrics completado - Retornando ${metrics.length} caracteres`);
      return metrics;
      
    } catch (error) {
      this.logger.error(`❌ ERROR en getMetrics: ${error.message}`);
      this.logger.error(`❌ Stack trace:`, error.stack);
      throw error;
    }
  }

  getRegistry(): client.Registry {
    this.logger.debug('📚 getRegistry llamado');
    return this.register;
  }

  observeHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    this.logger.debug(`🌐 observeHttpRequest: ${method} ${route} ${statusCode} ${durationSeconds}s`);
    try {
      this.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        durationSeconds
      );
      this.logger.debug(`✅ Métrica HTTP observada exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error en observeHttpRequest: ${error.message}`);
    }
  }
}