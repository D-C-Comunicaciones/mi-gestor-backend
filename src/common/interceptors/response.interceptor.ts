import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 🚫 No transformar la respuesta del endpoint de métricas
    if (request.path.includes('/metrics')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        let customMessage = 'Operación exitosa';

        // Extraer y eliminar mensaje personalizado si existe
        if (data && typeof data === 'object' && 'customMessage' in data) {
          customMessage = data.customMessage;
          delete data.customMessage;
        }

        const statusCode = response.statusCode || 200;

        const responseBody: any = {
          message: customMessage,
          code: statusCode,
          status: 'success',
        };

        // Solo agregar `data` si no está vacío
        if (data && Object.keys(data).length > 0) {
          responseBody.data = data;
        }

        return responseBody;
      }),
    );
  }
}
