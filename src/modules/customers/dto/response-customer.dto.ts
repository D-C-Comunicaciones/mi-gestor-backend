import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { format } from 'date-fns';

export class ResponseCustomerDto {
  @ApiProperty({ example: 1, description: 'ID del cliente' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Ana', description: 'Nombre del cliente' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'García', description: 'Apellido del cliente' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: 'cliente1@migestor.com', description: 'Email del usuario' })
  @Expose() // <-- Asegúrate de incluir @Expose() para que class-transformer lo incluya
  email: string;

  @ApiProperty({ example: 1, description: 'ID tipo de documento' })
  @Expose()
  typeDocumentIdentificationId: number;

  @ApiProperty({ example: 'Cédula de Ciudadanía', description: 'Nombre del tipo de documento' })
  @Expose()
  typeDocumentIdentificationName: string;

  @ApiProperty({ example: 1122233344, description: 'Número de documento' })
  @Expose()
  documentNumber: number;

  @ApiProperty({ example: '1992-09-21', description: 'Fecha de nacimiento' })
  @Expose()
  birthDate: string;

  @ApiProperty({ example: 1, description: 'ID género' })
  @Expose()
  genderId: number;

  @ApiProperty({ example: 'Femenino', description: 'Nombre del género' })
  @Expose()
  genderName: string;

  @ApiProperty({ example: '+573009998887', description: 'Teléfono contacto' })
  @Expose()
  phone: string;

  @ApiProperty({ example: 'Carrera 7 #12-34', description: 'Dirección' })
  @Expose()
  address: string;

  @ApiPropertyOptional({ example: 2, description: 'ID zona asignada' })
  @Expose()
  zoneId?: number;

  @ApiPropertyOptional({ example: 'Norte', description: 'Nombre de la zona' })
  @Expose()
  zoneName?: string;

  @ApiPropertyOptional({ example: 'ZN001', description: 'Código de la zona' })
  @Expose()
  zoneCode?: string;

  @ApiProperty({ example: true, description: 'Estado activo/inactivo' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2025-05-04 10:00:00', description: 'Fecha de creación' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : null)

  createdAt: string;

  @ApiProperty({ example: '2025-05-04 10:00:00', description: 'Fecha de última actualización' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : null)
  updatedAt: string;
}