import { UserResponseDto } from '@modules/users/dto';
import { ZoneResponseDto } from '@modules/zones/dto';
import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { format } from 'date-fns';

export class ResponseCollectorDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  phone: string;

  @Expose()
  @Type(() => ZoneResponseDto)
  zone?: ZoneResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

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
