// decimal.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  private safeConvertDecimal(value: any): any {
    if (value == null) return null;
    
    try {
      if (value instanceof Prisma.Decimal) {
        return value.toNumber();
      }
      
      if (typeof value === 'object' && value !== null) {
        if ('toNumber' in value && typeof value.toNumber === 'function') {
          return value.toNumber();
        }
        
        // Si es un objeto pero no es Decimal, devolver null
        return null;
      }
      
      return value;
    } catch (error) {
      console.warn('Error converting Decimal:', error);
      return null;
    }
  }

  private convertDecimalsToNumbers(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDecimalsToNumbers(item));
    }

    if (typeof obj === 'object') {
      // Si es Decimal, convertirlo
      if (obj instanceof Prisma.Decimal) {
        return this.safeConvertDecimal(obj);
      }

      // Si es un objeto regular, procesar cada propiedad
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.convertDecimalsToNumbers(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.convertDecimalsToNumbers(data))
    );
  }
}