import { Exclude, Expose, Transform } from 'class-transformer';
// import { format } from 'path';
import { format } from 'date-fns';

export class ResponseUserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Exclude()
  password: string;

  @Expose()
  status: string;
  
  @Expose()
  roleId: number;
  
  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), { toPlainOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'), { toPlainOnly: true })
  updatedAt: Date;
}
