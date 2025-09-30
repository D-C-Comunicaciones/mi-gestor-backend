import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CollectionReportCollectorSummaryDto {
  @ApiProperty({ example: 1, description: 'ID del cobrador' })
  @Expose()
  collectorId: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del cobrador' })
  @Expose()
  collectorName: string;

  @ApiProperty({ example: 'Centro', description: 'Zona asignada al cobrador' })
  @Expose()
  zoneName: string;

  @ApiProperty({ example: 5000000.0, description: 'Total asignado al cobrador' })
  @Expose()
  totalAssigned: number;

  @ApiProperty({ example: 4500000.0, description: 'Total recaudado por el cobrador' })
  @Expose()
  totalCollected: number;

  @ApiProperty({ example: 500000.0, description: 'Total pendiente por recaudar' })
  @Expose()
  totalPending: number;

  @ApiProperty({ example: 90.0, description: 'Porcentaje de rendimiento del cobrador' })
  @Expose()
  performancePercentage: number;

  @ApiProperty({ example: 85.5, description: 'Eficiencia de cobranza (% cuotas pagadas)' })
  @Expose()
  collectionEfficiency: number;

  @ApiProperty({ example: 24, description: 'Cuotas asignadas al cobrador' })
  @Expose()
  installmentsAssigned: number;

  @ApiProperty({ example: 20, description: 'Cuotas pagadas completamente' })
  @Expose()
  installmentsPaid: number;

  @ApiProperty({ example: 4, description: 'Cuotas pendientes de pago' })
  @Expose()
  installmentsPending: number;

  @ApiProperty({ example: 15, description: 'Número total de cobros realizados' })
  @Expose()
  totalCollectionsMade: number;

  @ApiProperty({ example: 8, description: 'Clientes únicos atendidos' })
  @Expose()
  uniqueCustomers: number;

  @ApiProperty({ example: 12, description: 'Préstamos únicos gestionados' })
  @Expose()
  uniqueLoans: number;

  @ApiProperty({ example: 300000.0, description: 'Promedio por cobro realizado' })
  @Expose()
  averageCollectionAmount: number;
}

export class CollectionReportDetailDto {
  @ApiProperty({ example: 1, description: 'ID del pago' })
  @Expose()
  paymentId: number;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha del recaudo' })
  @Expose()
  paymentDate: string;

  @ApiProperty({ example: 146763.32, description: 'Monto total recaudado' })
  @Expose()
  amount: number;

  @ApiProperty({ example: 1, description: 'ID de la cuota pagada' })
  @Expose()
  installmentId: number;

  @ApiProperty({ example: 'Juan Pérez García', description: 'Nombre completo del cliente' })
  @Expose()
  customerName: string;

  @ApiProperty({ example: '87654321', description: 'Número de documento del cliente' })
  @Expose()
  customerDocument: string;

  @ApiProperty({ example: 'Carlos Cobrador', description: 'Nombre completo del cobrador' })
  @Expose()
  collectorName: string;

  @ApiProperty({ example: 1, description: 'ID del cobrador' })
  @Expose()
  collectorId: number;

  @ApiProperty({ example: 2, description: 'ID del préstamo asociado' })
  @Expose()
  loanId: number;

  @ApiProperty({ example: 1, description: 'ID del cliente' })
  @Expose()
  customerId: number;

  @ApiProperty({ example: 'Centro', description: 'Zona donde se realizó el recaudo' })
  @Expose()
  zoneName: string;

  @ApiProperty({ example: '2024-01-10', description: 'Fecha de vencimiento de la cuota' })
  @Expose()
  installmentDueDate: string;

  @ApiProperty({ example: true, description: 'Indica si la cuota está completamente pagada' })
  @Expose()
  installmentIsPaid: boolean;

  @ApiProperty({ example: 150000.0, description: 'Monto total de la cuota' })
  @Expose()
  installmentTotalAmount: number;

  @ApiProperty({ example: 146763.32, description: 'Monto pagado de la cuota' })
  @Expose()
  installmentPaidAmount: number;
}

export class BestWorstCollectorDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del cobrador' })
  @Expose()
  name: string;

  @ApiProperty({ example: 95.5, description: 'Porcentaje de rendimiento' })
  @Expose()
  percentage: number;

  @ApiProperty({ example: 2500000.0, description: 'Total recaudado' })
  @Expose()
  collected: number;

  @ApiProperty({ example: 2620000.0, description: 'Total asignado' })
  @Expose()
  assigned: number;

  @ApiProperty({ example: 'Centro', description: 'Zona del cobrador' })
  @Expose()
  zone: string;

  @ApiProperty({ example: 25, description: 'Número de cobros realizados' })
  @Expose()
  totalCollectionsMade: number;
}

export class ActiveCollectorDto {
  @ApiProperty({ example: 'Carlos Rodríguez', description: 'Nombre del cobrador' })
  @Expose()
  name: string;

  @ApiProperty({ example: 35, description: 'Número de cobros realizados' })
  @Expose()
  totalCollectionsMade: number;

  @ApiProperty({ example: 1800000.0, description: 'Total recaudado' })
  @Expose()
  collected: number;

  @ApiProperty({ example: 88.2, description: 'Porcentaje de rendimiento' })
  @Expose()
  percentage: number;

  @ApiProperty({ example: 'Norte', description: 'Zona del cobrador' })
  @Expose()
  zone: string;
}

export class CollectionReportSummaryDto {
  @ApiProperty({ example: 125, description: 'Cantidad total de recaudos registrados' })
  @Expose()
  totalCollections: number;

  @ApiProperty({ example: 50000000.0, description: 'Total asignado a cobradores' })
  @Expose()
  totalAssigned: number;

  @ApiProperty({ example: 42500000.0, description: 'Total recaudado' })
  @Expose()
  totalCollected: number;

  @ApiProperty({ example: 7500000.0, description: 'Total pendiente por recaudar' })
  @Expose()
  totalPending: number;

  @ApiProperty({ example: 85.0, description: 'Porcentaje de rendimiento global' })
  @Expose()
  globalPerformancePercentage: number;

  @ApiProperty({ example: 5, description: 'Cantidad de cobradores activos' })
  @Expose()
  activeCollectors: number;

  @ApiProperty({ example: 85, description: 'Cantidad de clientes únicos' })
  @Expose()
  uniqueCustomers: number;

  @ApiProperty({ example: 120, description: 'Cantidad de préstamos únicos' })
  @Expose()
  uniqueLoans: number;

  @ApiProperty({ example: 180, description: 'Total de cuotas en el período' })
  @Expose()
  totalInstallmentsInPeriod: number;

  @ApiProperty({ example: 125, description: 'Total de cuotas pagadas' })
  @Expose()
  totalInstallmentsPaid: number;

  @ApiProperty({ example: 55, description: 'Total de cuotas pendientes' })
  @Expose()
  totalInstallmentsPending: number;

  @ApiProperty({ example: 8500000.0, description: 'Promedio recaudado por cobrador' })
  @Expose()
  averageCollectedPerCollector: number;

  @ApiProperty({ example: 340000.0, description: 'Promedio por recaudo' })
  @Expose()
  averageCollectionAmount: number;

  @ApiProperty({ description: 'Mejor cobrador por rendimiento' })
  @Expose()
  @Type(() => BestWorstCollectorDto)
  bestPerformanceCollector: BestWorstCollectorDto;

  @ApiProperty({ description: 'Peor cobrador por rendimiento' })
  @Expose()
  @Type(() => BestWorstCollectorDto)
  worstPerformanceCollector: BestWorstCollectorDto;


  @ApiProperty({ description: 'Cobrador menos activo (menos cobros)' })
  @Expose()
  @Type(() => ActiveCollectorDto)
  leastActiveCollector: ActiveCollectorDto;

  @ApiProperty({ description: 'Mejor cobrador (compatibilidad)' })
  @Expose()
  @Type(() => BestWorstCollectorDto)
  bestCollector: BestWorstCollectorDto;

  @ApiProperty({ description: 'Peor cobrador (compatibilidad)' })
  @Expose()
  @Type(() => BestWorstCollectorDto)
  worstCollector: BestWorstCollectorDto;
}

export class CollectionReportMetadataDto {
  @ApiProperty({ example: 125, description: 'Total de registros' })
  @Expose()
  totalRecords: number;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de generación del reporte' })
  @Expose()
  generatedAt: string;

  @ApiProperty({ example: '2024-01-01 al 2024-01-31', description: 'Período del reporte' })
  @Expose()
  period: string;

  @ApiProperty({ example: 5, description: 'Total de cobradores' })
  @Expose()
  totalCollectors: number;

  @ApiProperty({ example: 4, description: 'Cobradores activos (con cobros)' })
  @Expose()
  activeCollectors: number;
}

export class ResponseCollectionReportDto {
  @ApiProperty({ example: '2024-01-01', description: 'Fecha de inicio del período' })
  @Expose()
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'Fecha de fin del período' })
  @Expose()
  endDate: string;

  @ApiProperty({ description: 'Resumen general del período' })
  @Expose()
  @Type(() => CollectionReportSummaryDto)
  summary: CollectionReportSummaryDto;

  @ApiProperty({ description: 'Resumen por cobrador', type: [CollectionReportCollectorSummaryDto] })
  @Expose()
  @Type(() => CollectionReportCollectorSummaryDto)
  collectorSummary: CollectionReportCollectorSummaryDto[];

  @ApiProperty({ description: 'Detalle de todos los recaudos', type: [CollectionReportDetailDto] })
  @Expose()
  @Type(() => CollectionReportDetailDto)
  collections: CollectionReportDetailDto[];

  @ApiProperty({ description: 'Metadatos del reporte' })
  @Expose()
  @Type(() => CollectionReportMetadataDto)
  metadata: CollectionReportMetadataDto;
}
