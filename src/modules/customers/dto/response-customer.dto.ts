import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { format } from 'date-fns';

export class ResponseCustomerDto {
  @ApiProperty() @Expose() id: number;
  @ApiProperty() @Expose() firstName: string;
  @ApiProperty() @Expose() lastName: string;

  @ApiPropertyOptional() @Expose() 
  @Transform(({ obj }) => obj.email || '')
  email: string | null;

  @ApiProperty() @Expose() typeDocumentIdentificationId: number;

  // Leer la propiedad plana typeDocumentName
  @ApiPropertyOptional() 
  @Expose()
  @Transform(({ obj }) => obj.typeDocumentIdentificationName || '')
  typeDocumentIdentificationName: string;

  @ApiPropertyOptional() 
  @Expose()
  @Transform(({ obj }) => obj.typeDocumentIdentificationCode || '')
  typeDocumentIdentificationCode: string;

  @ApiProperty() @Expose() documentNumber: number;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : '')
  birthDate: string;

  @ApiProperty() @Expose() genderId: number;

  // Leer la propiedad plana genderName
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ obj }) => obj.genderName || '')
  genderName: string;

  @ApiProperty() @Expose() phone: string;
  @ApiProperty() @Expose() address: string;

  @ApiPropertyOptional() @Expose() zoneId?: number;

  // Leer las propiedades planas zoneName y zoneCode
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ obj }) => obj.zoneName || '')
  zoneName: string;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ obj }) => obj.zoneCode || '')
  zoneCode: string;

  @ApiProperty() @Expose() isActive: boolean;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) return format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
    if (obj.createdAtTimestamp) return format(new Date(obj.createdAtTimestamp), 'yyyy-MM-dd HH:mm:ss');
    return '';
  })
  createdAt: string;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) return format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
    if (obj.updatedAtTimestamp) return format(new Date(obj.updatedAtTimestamp), 'yyyy-MM-dd HH:mm:ss');
    return '';
  })
  updatedAt: string;
}
