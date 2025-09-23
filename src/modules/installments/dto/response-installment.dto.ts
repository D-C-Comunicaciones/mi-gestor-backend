import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de cuota/installment
 * Contiene la información completa de una cuota de préstamo
 * Utilizado en consultas de cronogramas de pago y seguimiento de cuotas
 */
export class ResponseInstallmentDto {
  @ApiProperty({
    description: 'Identificador único de la cuota',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ID del préstamo al que pertenece la cuota',
    example: 15,
    type: 'integer'
  })
  @Expose()
  loanId: number;

  @ApiProperty({
    description: 'Número de la cuota en la secuencia del préstamo',
    example: 3,
    type: 'integer',
    minimum: 1
  })
  @Expose()
  installmentNumber: number;

  @ApiProperty({
    description: 'Fecha de vencimiento de la cuota',
    example: '2025-02-15',
    type: 'string',
    format: 'date'
  })
  @Expose()
  dueDate: string;

  @ApiProperty({
    description: 'Monto total de la cuota (capital + intereses)',
    example: 125000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Monto correspondiente al capital en esta cuota',
    example: 100000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  capitalAmount: number;

  @ApiProperty({
    description: 'Monto correspondiente a intereses en esta cuota',
    example: 25000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  interestAmount: number;

  @ApiProperty({
    description: 'Monto pagado hasta la fecha en esta cuota',
    example: 50000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  paidAmount: number;

  @ApiProperty({
    description: 'Saldo pendiente por pagar en la cuota',
    example: 75000,
    type: 'number',
    minimum: 0
  })
  @Expose()
  remainingAmount: number;

  @ApiProperty({
    description: 'Indica si la cuota está completamente pagada',
    example: false,
    type: 'boolean'
  })
  @Expose()
  isPaid: boolean;

  @ApiProperty({
    description: 'Fecha en que se completó el pago de la cuota',
    example: '2025-02-10T14:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Expose()
  paidAt?: Date;

  @ApiProperty({
    description: 'ID del estado actual de la cuota',
    example: 2,
    type: 'integer'
  })
  @Expose()
  statusId: number;

  @ApiProperty({
    description: 'Nombre del estado de la cuota',
    example: 'Pending',
    type: 'string',
    enum: ['Pending', 'Paid', 'Overdue Paid', 'Partial Payment']
  })
  @Expose()
  statusName: string;

  @ApiProperty({
    description: 'Indica si la cuota está vencida',
    example: true,
    type: 'boolean'
  })
  @Expose()
  isOverdue: boolean;

  @ApiProperty({
    description: 'Días de retraso desde el vencimiento',
    example: 5,
    type: 'integer',
    minimum: 0
  })
  @Expose()
  daysOverdue: number;

  @ApiProperty({
    description: 'Monto de intereses moratorios acumulados',
    example: 15000,
    type: 'number',
    minimum: 0,
    required: false
  })
  @Expose()
  moratoryInterest?: number;

  @ApiProperty({
    description: 'Indica si la cuota está activa en el sistema',
    example: true,
    type: 'boolean',
    default: true
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T08:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2025-01-04T16:20:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Expose()
  updatedAt: Date;
}