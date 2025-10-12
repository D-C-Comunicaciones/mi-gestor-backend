import { MetricService } from "@infraestructure/metrics/metrics.service";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from "@nestjs/common";
import { Observable, finalize } from "rxjs";

@Injectable()
export class MetricsHttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsHttpInterceptor.name);

  constructor(private readonly metrics: MetricService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const route = this.getRoute(request);
    const method = request.method;
    const startTime = Date.now();

    this.metrics.incActiveRequests(response);
    this.logger.log(`📈 Active requests incrementada. Ruta: ${route}, Método: ${method}`);

    return next.handle().pipe(
      finalize(() => {
        const duration = (Date.now() - startTime) / 1000;

        try {
          this.metrics.observeHttpRequest(method, route, response.statusCode, duration);
          this.metrics.decActiveRequests(response);
          this.logger.log(`📉 Active requests decrementada. Ruta: ${route}, Método: ${method}, Duración: ${duration}s`);
        } catch (error) {
          this.logger.error(`❌ Error registrando métricas de request: ${error.message}`);
        }
      })
    );
  }

  private getRoute(request: any): string {
    return request.route?.path ||
      request.url?.split('?')[0] ||
      'unknown';
  }
}
