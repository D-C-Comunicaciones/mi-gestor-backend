import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseCustomerDto {
  @ApiProperty({ example: 1 }) @Expose() id: number;
  @ApiProperty({ example: 'Juan' }) @Expose() firstName: string;
  @ApiProperty({ example: 'Pérez' }) @Expose() lastName: string;
  @ApiProperty({ example: 1 }) @Expose() typeDocumentIdentificationId: number;
  @ApiProperty({ example: 'Cédula de Ciudadanía' }) @Expose() typeDocumentIdentificationName: string;
  @ApiProperty({ example: 1234567890 }) @Expose() documentNumber: number;
  @ApiProperty({ example: 1 }) @Expose() genderId: number;
  @ApiProperty({ example: 'Masculino' }) @Expose() genderName: string;
  
  @ApiProperty({ example: '2005-05-15' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd') : null)
  birthDate: string;
  
  @ApiProperty({ example: 'Cll 86#73-202 2do piso' }) @Expose() address: string;
  @ApiProperty({ example: '+573001234567' }) @Expose() phone: string;
  @ApiProperty({ example: 2 }) @Expose() zoneId: number;
  @ApiProperty({ example: 'Centro' }) @Expose() zoneName: string;
  @ApiProperty({ example: 'CTR' }) @Expose() zoneCode: string;
  @ApiProperty({ example: null, nullable: true }) @Expose() userId: number | null;
  @ApiProperty({ example: true }) @Expose() isActive: boolean;
}