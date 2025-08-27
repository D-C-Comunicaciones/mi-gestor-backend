// common/interceptors/prisma-decimal.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaDecimalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformDecimals(data))
    );
  }

  private transformDecimals(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transformDecimals(item));
    }

    if (typeof data === 'object') {
      // Si es un objeto Decimal de Prisma
      if (data instanceof Prisma.Decimal) {
        return data.toNumber();
      }

      // Si es un objeto regular con propiedades
      const result = {};
      for (const key of Object.keys(data)) {
        result[key] = this.transformDecimals(data[key]);
      }
      return result;
    }

    return data;
  }
}