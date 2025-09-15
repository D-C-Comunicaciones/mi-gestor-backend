import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { format } from 'date-fns';

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

export class ResponseCollectionDto {
  @ApiProperty({ example: true, description: 'Indica si la operación fue exitosa.' })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Pago registrado correctamente', description: 'Mensaje de resultado de la operación.' })
  @Expose()
  message: string;

  @ApiProperty({ example: 456, description: 'ID del pago registrado.' })
  @Expose()
  paymentId: number;

  @ApiProperty({ example: 789, description: 'ID del préstamo asociado al pago.' })
  @Expose()
  loanId: number;

  @ApiProperty({ example: '2025-05-04' })
  @Expose()
  @Transform(({ value }) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : null)
  paymentDate: Date | null;

  @ApiProperty({ example: '100.00', description: 'Monto aplicado al capital.' })
  @Expose()
  appliedToCapital: string;

  @ApiProperty({ example: '20.00', description: 'Monto aplicado al interés.' })
  @Expose()
  appliedToInterest: string;

  @ApiProperty({ example: '5.00', description: 'Monto aplicado a mora.' })
  @Expose()
  appliedToLateFee: string;

  @ApiProperty({ example: '0.00', description: 'Monto excedente si lo hay.' })
  @Expose()
  excessAmount?: string;

  @ApiProperty({ example: '0.00', description: 'Nuevo saldo pendiente del préstamo.' })
  @Expose()
  newRemainingBalance: string;

  @ApiProperty({ example: false, description: 'Indica si el préstamo quedó totalmente pagado.' })
  @Expose()
  isFullyPaid?: boolean; // opcional, útil si quieres indicarle al frontend

  @ApiProperty({ type: [AllocationResponseDto], description: 'Detalle de las asignaciones a cuotas.' })
  @Expose()
  @Type(() => AllocationResponseDto)
  allocations: AllocationResponseDto[];
}
