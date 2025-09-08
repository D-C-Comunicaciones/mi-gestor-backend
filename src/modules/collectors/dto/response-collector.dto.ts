import { Expose, Transform, Type } from 'class-transformer';
import { format } from 'date-fns';
import { UserResponseDto } from '@modules/users/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseZoneDto } from '@modules/zones/dto';

export class ResponseCollectorDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 'Juan' }) @Expose() firstName: string;
  @ApiProperty({ example: 'Pérez' }) @Expose() lastName: string;
  @ApiProperty({ example: 1 }) @Expose() typeDocumentIdentificationId: number;
  @ApiProperty({ example: 1234567890 }) @Expose() documentNumber: number;

  @ApiProperty({ example: '1990-05-14' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd') : value), { toPlainOnly: true })
  birthDate: Date;

  @ApiProperty({ example: 1 }) @Expose() genderId: number;
  @ApiProperty({ example: '+573001234567' }) @Expose() phone: string;
  @ApiProperty({ example: 'Calle 1 #2-34' }) @Expose() address: string;

  @ApiPropertyOptional({ example: 2 }) @Expose() zoneId?: number | null;
  @ApiPropertyOptional({ example: 5 }) @Expose() userId?: number | null;

  @ApiPropertyOptional({ type: () => ResponseZoneDto }) @Expose() @Type(() => ResponseZoneDto) zone?: ResponseZoneDto | null;
  @ApiPropertyOptional({ type: () => UserResponseDto }) @Expose() @Type(() => UserResponseDto) user?: UserResponseDto | null;

  @ApiProperty({ example: '2024-01-01 10:00:00' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-05 12:30:00' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  updatedAt: Date;
}