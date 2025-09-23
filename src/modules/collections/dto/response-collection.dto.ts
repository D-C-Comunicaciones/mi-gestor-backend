import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AllocationResponseDto {
  @ApiProperty({ example: 123, description: 'ID de la cuota (installment) a la que se asignó el pago.' })
  @Expose()
  installmentId: number;

  @ApiProperty({ example: '100.00', description: 'Monto aplicado al capital en formato string.' })
  @Expose()
  appliedToCapital: string; // en string para evitar problemas de precision

  @ApiProperty({ example: '20.00', description: 'Monto aplicado al interés en formato string.' })
  @Expose()
  appliedToInterest: string;

  @ApiProperty({ example: '5.00', description: 'Monto aplicado a mora en formato string.' })
  @Expose()
  appliedToLateFee: string;
}

/**
 * DTO para la respuesta de recaudo/cobro realizado
 * Contiene la información completa de un recaudo registrado por un cobrador
 * Utilizado en consultas de historial y reportes de cobranza
 */
export class ResponseCollectionDto {
  @ApiProperty({
    description: 'Identificador único del recaudo',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ID del préstamo al cual se aplicó el recaudo',
    example: 15,
    type: 'integer'
  })
  @Expose()
  loanId: number;

  @ApiProperty({
    description: 'Número de identificación del préstamo para referencia',
    example: 'LN-2025-000015',
    type: 'string'
  })
  @Expose()
  loanNumber?: string;

  @ApiProperty({
    description: 'ID del cliente que realizó el pago',
    example: 8,
    type: 'integer'
  })
  @Expose()
  customerId: number;

  @ApiProperty({
    description: 'Nombre completo del cliente que pagó',
    example: 'Juan Carlos Pérez González',
    type: 'string'
  })
  @Expose()
  customerName: string;

  @ApiProperty({
    description: 'Número de documento de identidad del cliente',
    example: '12345678',
    type: 'string'
  })
  @Expose()
  customerDocument: string;

  @ApiProperty({
    description: 'ID del cobrador que registró el recaudo',
    example: 3,
    type: 'integer',
    required: false
  })
  @Expose()
  collectorId?: number;

  @ApiProperty({
    description: 'Nombre completo del cobrador que realizó el cobro',
    example: 'María Elena Rodríguez',
    type: 'string',
    required: false
  })
  @Expose()
  collectorName?: string;

  @ApiProperty({
    description: 'Monto total recaudado en la transacción',
    example: 125000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Monto aplicado al capital del préstamo',
    example: 100000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  appliedToCapital: number;

  @ApiProperty({
    description: 'Monto aplicado a intereses del préstamo',
    example: 20000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  appliedToInterest: number;

  @ApiProperty({
    description: 'Monto aplicado a intereses de mora',
    example: 5000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  appliedToLateFee: number;

  @ApiProperty({
    description: 'Tipo de pago registrado',
    example: 'CAPITAL',
    type: 'string',
    enum: ['CAPITAL', 'INTEREST', 'LATE_FEE', 'FULL_PAYMENT']
  })
  @Expose()
  paymentType: string;

  @ApiProperty({
    description: 'Fecha y hora cuando se registró el recaudo',
    example: '2025-01-04T14:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  date: Date;

  @ApiProperty({
    description: 'Zona o ruta donde se realizó el cobro',
    example: 'Norte - Ruta 1',
    type: 'string',
    required: false
  })
  @Expose()
  zone?: string;

  @ApiProperty({
    description: 'Observaciones adicionales del cobro',
    example: 'Pago realizado en efectivo en el domicilio del cliente',
    type: 'string',
    maxLength: 500,
    required: false
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Estado del recaudo (confirmado, pendiente, cancelado)',
    example: 'confirmed',
    type: 'string',
    enum: ['confirmed', 'pending', 'cancelled']
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Saldo restante del préstamo después del pago',
    example: 875000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  remainingBalance?: number;

  @ApiProperty({
    description: 'ID del usuario que registró el recaudo en el sistema',
    example: 5,
    type: 'integer',
    required: false
  })
  @Expose()
  recordedByUserId?: number;

  @ApiProperty({
    description: 'Nombre del usuario que registró el recaudo',
    example: 'Ana Supervisor',
    type: 'string',
    required: false
  })
  @Expose()
  recordedByUserName?: string;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2025-01-04T14:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2025-01-04T14:35:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  updatedAt: Date;
}
