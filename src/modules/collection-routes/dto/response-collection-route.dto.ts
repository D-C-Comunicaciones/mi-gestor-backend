import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns/format';

export class CollectorResponseDto {
  @ApiProperty({ description: 'ID del cobrador', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre del cobrador', example: 'Juan' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del cobrador', example: 'Pérez' })
  lastName: string;

  @ApiProperty({ description: 'Teléfono del cobrador', example: '123456789' })
  phone: string;
}

export class ResponseCollectionRouteDto {
  @ApiProperty({ description: 'ID de la ruta', example: 1 })
  @Expose()
  id: number;

  @ApiPropertyOptional({ description: 'ID del cobrador asignado (opcional)', example: 1 })
  @Expose()
  collectorId?: number;

  @ApiProperty({ description: 'Nombre de la ruta', example: 'Ruta Centro - Zona 1' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Estado de la ruta', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2025-10-01 14:21:57' })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización', example: '2025-10-01 14:21:57' })
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'ID del usuario creador', example: 1 })
  @Expose()
  createdBy: number;

  @ApiPropertyOptional({ description: 'Información del cobrador', type: CollectorResponseDto })
  @Expose()
  collector?: CollectorResponseDto;
}

export class StatusChangeResponseDto {
  @ApiProperty({ description: 'ID de la ruta', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nuevo estado de la ruta', example: false })
  isActive: boolean;

  @ApiProperty({ description: 'Mensaje de confirmación', example: 'Estado de la ruta actualizado exitosamente' })
  message: string;
}

export class DeleteResponseDto {
  @ApiProperty({ description: 'Mensaje de confirmación', example: 'Ruta de cobranza eliminada exitosamente' })
  message: string;

  @ApiProperty({ description: 'ID de la ruta eliminada', example: 1 })
  deletedId: number;
}
