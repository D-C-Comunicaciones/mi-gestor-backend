import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { map, Observable } from "rxjs";

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformDecimals(data)),
    );
  }

  private transformDecimals(obj: any): any {
    if (obj instanceof Decimal) return obj.toNumber();
    if (Array.isArray(obj)) return obj.map(o => this.transformDecimals(o));
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.transformDecimals(v)])
      );
    }
    return obj;
  }
}
