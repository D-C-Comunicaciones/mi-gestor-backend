import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';

export class ResponseLoginAuditDto {
  @Expose() id: number;
  @Expose() userId: number;
  @Expose() ip: string;
  @Expose() device: string;
  @Expose() location?: string;

  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), {
    toPlainOnly: true,
  })
  timestamp: string;
}