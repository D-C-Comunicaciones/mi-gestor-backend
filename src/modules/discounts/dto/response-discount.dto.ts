import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseDiscountDto {
  @ApiProperty({
    description: 'Identificador único del descuento',
    example: 1,
    type: 'number'
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Monto del descuento en pesos colombianos',
    example: 88100,
    type: 'number'
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'ID del tipo de descuento',
    example: 1,
    type: 'number'
  })
  @Expose()
  discountTypeId: number;

  @ApiProperty({
    description: 'Descripción detallada del descuento',
    example: 'Descuento por buen comportamiento de pago a cuota, para que pague',
    type: 'string'
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'ID de la moratoria asociada',
    example: 1,
    type: 'number'
  })
  @Expose()
  moratoryId: number;

  @ApiProperty({
    description: 'Estado activo/inactivo del descuento',
    example: true,
    type: 'boolean'
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-20T14:45:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  updatedAt: Date;
}
