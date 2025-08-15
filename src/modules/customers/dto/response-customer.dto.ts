import { Expose, Transform, Type } from 'class-transformer';
import { format } from 'date-fns';
import { UserResponseDto } from '@modules/users/dto';
import { ZoneResponseDto } from '@modules/zones/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseCustomerDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 'Ana' }) @Expose() firstName: string;
  @ApiProperty({ example: 'García' }) @Expose() lastName: string;
  @ApiProperty({ example: 1 }) @Expose() typeDocumentIdentificationId: number;
  @ApiProperty({ example: 1122233344 }) @Expose() documentNumber: number;

  @ApiProperty({ example: '1992-09-21' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd') : value), { toPlainOnly: true })
  birthDate: Date;

  @ApiProperty({ example: 1 }) @Expose() genderId: number;
  @ApiProperty({ example: '+573009998887' }) @Expose() phone: string;
  @ApiProperty({ example: 'Carrera 7 #12-34' }) @Expose() address: string;
  @ApiPropertyOptional({ example: 2 }) @Expose() zoneId?: number | null;
  @ApiPropertyOptional({ example: 10 }) @Expose() userId?: number | null;
  @ApiProperty({ example: true }) @Expose() isActive: boolean;

  @ApiPropertyOptional({ type: () => ZoneResponseDto }) @Expose() @Type(() => ZoneResponseDto) zone?: ZoneResponseDto | null;
  @ApiPropertyOptional({ type: () => UserResponseDto }) @Expose() @Type(() => UserResponseDto) user?: UserResponseDto | null;

  @ApiProperty({ example: '2024-01-01 10:00:00' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  createdAt: Date | null;

  @ApiProperty({ example: '2024-01-05 11:15:30' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  updatedAt: Date | null;
}
