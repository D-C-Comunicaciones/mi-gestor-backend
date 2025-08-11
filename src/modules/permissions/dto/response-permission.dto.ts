import { Expose, Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { format } from 'date-fns';

export class ResponsePermissionDto {

  @Expose() id: number;

  @Expose() name: string;

  @Expose()
  @IsOptional()
  @Transform(({ value }) => value ?? '', { toPlainOnly: true })
  description?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), {
    toPlainOnly: true,
  })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), {
    toPlainOnly: true,
  })
  updatedAt: Date;
}
