import { MetricService } from "@infraestructure/metrics/metrics.service";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class MetricsHttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsHttpInterceptor.name);

  constructor(private readonly metrics: MetricService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    this.logger.log(`🔄 Interceptor ejecutado para: ${request.method} ${request.url}`);

    const route = this.getRoute(request);
    const method = request.method;

    // 👇 ENFOQUE ALTERNATIVO: Usar Date.now() para calcular duración manualmente
    const startTime = Date.now();
    this.metrics.incActiveRequests();

    this.logger.log(`📈 Active requests incrementada. Ruta: ${route}, Método: ${method}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // segundos
          this.logger.log(`✅ Request exitosa. Status: ${response.statusCode}. Duración: ${duration}s. Registrando métrica...`);

          // 👇 Usar observeHttpRequest en lugar de timer
          this.metrics.observeHttpRequest(method, route, response.statusCode, duration);

          this.metrics.decActiveRequests();
          this.logger.log(`📉 Active requests decrementada`);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          this.logger.error(`❌ Request con error. Status: ${response.statusCode}. Duración: ${duration}s. Error: ${error.message}`);

          this.metrics.observeHttpRequest(method, route, response.statusCode, duration);
          this.metrics.decActiveRequests();
          this.logger.log(`📉 Active requests decrementada por error`);
        }
      }),
    );
  }

  private getRoute(request: any): string {
    return request.route?.path ||
      request.url?.split('?')[0] ||
      'unknown';
  }
}