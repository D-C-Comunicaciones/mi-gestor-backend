import { MetricService } from "@infraestructure/metrics/metrics.service";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class MetricsHttpInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timer = this.metrics.startHttpTimer();
    this.metrics.incActiveRequests();

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const route = request.route?.path || request.url;
        timer({ method: request.method, route, status_code: response.statusCode });
        this.metrics.decActiveRequests();
      }),
    );
  }
}
