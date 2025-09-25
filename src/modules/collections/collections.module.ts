import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de recaudos y cobranza
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con el registro y gestión de recaudos:
 * 
 * Responsabilidades:
 * - Registro de pagos realizados por cobradores en campo
 * - Aplicación automática de pagos a préstamos (capital, intereses, mora)
 * - Consulta y filtrado de historial de recaudos
 * - Generación de reportes de cobranza por cobrador y zona
 * - Validación de geolocalización de cobros en ruta
 * - Integración con sistema de cuotas e intereses moratorios
 * 
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos y transacciones
 * 
 * Exportaciones:
 * - CollectionsService: Para uso en otros módulos (reportes, dashboard)
 * 
 * Casos de uso principales:
 * 1. Cobrador registra pago desde aplicación móvil
 * 2. Sistema calcula distribución automática del pago
 * 3. Se actualizan cuotas, saldos e intereses moratorios
 * 4. Supervisores consultan reportes de efectividad
 * 5. Gerencia analiza patrones de cobranza por zona
 * 
 * Integración con otros módulos:
 * - LoansModule: Actualiza saldos y estados de préstamos
 * - InstallmentsModule: Marca cuotas como pagadas
 * - CollectorsModule: Asocia recaudos con cobradores
 * - ReportsModule: Proporciona datos para reportes gerenciales
 * 
 * @version 1.0.0
 * @since 2025-01-04
 */
@Module({
  imports: [
    PrismaModule, // Acceso a base de datos para transacciones de pagos
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [
    CollectionsService, // Exportado para uso en reportes y dashboard
  ],
})
export class CollectionsModule {}
