import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CollectionSummaryDto {
  @ApiProperty({ description: 'Total asignado para cobrar en el período' })
  @Expose()
  totalAssigned: number;

  @ApiProperty({ description: 'Total efectivamente recaudado' })
  @Expose()
  totalCollected: number;

  @ApiProperty({ description: 'Número total de recaudos realizados' })
  @Expose()
  totalCollections: number;

  @ApiProperty({ description: 'Porcentaje de rendimiento global' })
  @Expose()
  globalPerformancePercentage: number;

  @ApiProperty({ description: 'Número de cobradores activos' })
  @Expose()
  activeCollectors: number;

  @ApiProperty({ description: 'Promedio recaudado por cobrador' })
  @Expose()
  averageCollectedPerCollector: number;
}

export class CollectorPerformanceDto {
  @ApiProperty({ description: 'ID del cobrador' })
  @Expose()
  collectorId: number;

  @ApiProperty({ description: 'Nombre completo del cobrador' })
  @Expose()
  collectorName: string;

  @ApiProperty({ description: 'Número de documento del cobrador' })
  @Expose()
  documentNumber: string;

  @ApiProperty({ description: 'Zona asignada al cobrador' })
  @Expose()
  zoneName: string;

  @ApiProperty({ description: 'Total asignado para cobrar' })
  @Expose()
  totalAssigned: number;

  @ApiProperty({ description: 'Total recaudado por el cobrador' })
  @Expose()
  totalCollected: number;

  @ApiProperty({ description: 'Número de recaudos realizados' })
  @Expose()
  collectionsCount: number;

  @ApiProperty({ description: 'Porcentaje de rendimiento del cobrador' })
  @Expose()
  performancePercentage: number;
}

export class CollectionDetailDto {
  @ApiProperty({ description: 'ID del pago' })
  @Expose()
  paymentId: number;

  @ApiProperty({ description: 'Fecha y hora del pago' })
  @Expose()
  paymentDate: string;

  @ApiProperty({ description: 'Monto recaudado' })
  @Expose()
  amount: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @Expose()
  customerName: string;

  @ApiProperty({ description: 'Documento del cliente' })
  @Expose()
  customerDocument: string;

  @ApiProperty({ description: 'Nombre del cobrador' })
  @Expose()
  collectorName: string;

  @ApiProperty({ description: 'Zona del cobrador' })
  @Expose()
  zoneName: string;

  @ApiProperty({ description: 'ID del préstamo' })
  @Expose()
  loanId: number;
}

export class ResponseCollectionReportDto {
  @ApiProperty({ description: 'Resumen general del reporte' })
  @Expose()
  @Type(() => CollectionSummaryDto)
  summary: CollectionSummaryDto;

  @ApiProperty({ description: 'Rendimiento individual de cada cobrador', type: [CollectorPerformanceDto] })
  @Expose()
  @Type(() => CollectorPerformanceDto)
  collectorSummary: CollectorPerformanceDto[];

  @ApiProperty({ description: 'Detalle de todos los recaudos', type: [CollectionDetailDto] })
  @Expose()
  @Type(() => CollectionDetailDto)
  collections: CollectionDetailDto[];

  @ApiProperty({ description: 'Fecha de inicio del reporte' })
  @Expose()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin del reporte' })
  @Expose()
  endDate: string;
}
