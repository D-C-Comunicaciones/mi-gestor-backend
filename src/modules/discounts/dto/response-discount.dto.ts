import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { format } from 'date-fns';

export class ResponseDiscountDto {
  @Expose()
  id: number;

  @Expose()
  description?: string;

  @Expose()
  amount?: string; // Decimal → string para transporte seguro

  @Expose()
  percentage?: number;

  @Expose()
  installmentId?: number;

  @Expose()
  moratoryId?: number;

 @ApiPropertyOptional({ example: '2025-08-27 17:12:21', nullable: true })
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      try { return format(new Date(value), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    if (obj?.createdAtTimestamp) {
      try { return format(new Date(obj.createdAtTimestamp), 'yyyy-MM-dd HH:mm:ss'); }
      catch { /* ignore */ }
    }
    return null;
  })
  createdAt: string | null;

  @Expose()
  createdBy?: number;

  // 👇 relaciones si quieres mostrarlas (opcional)
  // @Type(() => ResponseLoanDto)
  // loan?: ResponseLoanDto;
}
