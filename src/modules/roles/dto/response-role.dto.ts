import { Expose, Transform, Type } from 'class-transformer';
import { format } from 'date-fns';
import { ResponsePermissionDto } from '@permissions/dto';

export class ResponseRoleDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() description?: string;
  @Expose() isActive: boolean;

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

  @Expose()
  @Type(() => ResponsePermissionDto)
  permissions?: ResponsePermissionDto[]; // 👈 Opcional
}
