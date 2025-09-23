import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de descuentos
 *
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de descuentos:
 *
 * Responsabilidades:
 * - Creación y gestión de descuentos porcentuales y de monto fijo
 * - Configuración de condiciones y vigencias de descuentos
 * - Aplicación automática de descuentos según reglas de negocio
 * - Control de límites de uso por cliente y préstamo
 * - Validación de elegibilidad para descuentos
 * - Reportes de efectividad de promociones
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - DiscountsService: Para uso en otros módulos (Loans, Payments, Collections)
 *
 * Casos de uso principales:
 * 1. Configuración de promociones comerciales
 * 2. Incentivos para pagos anticipados o puntuales
 * 3. Descuentos especiales para clientes VIP o fidelizados
 * 4. Aplicación automática en procesos de pago
 * 5. Análisis de efectividad de estrategias promocionales
 *
 * Integración con otros módulos:
 * - LoansModule: Aplicación de descuentos en originación
 * - PaymentsModule: Descuentos en procesamiento de pagos
 * - CollectionsModule: Incentivos para cobranza
 * - CustomersModule: Validación de elegibilidad por cliente
 *
 * Tipos de descuentos soportados:
 * - PERCENTAGE: Descuento porcentual con límite máximo opcional
 * - FIXED_AMOUNT: Descuento de monto fijo
 *
 * @version 1.0.0
 * @since 2025-01-04
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [
    DiscountsService, // Exportado para uso en módulos de préstamos, pagos y cobranza
  ],
})
export class DiscountsModule {}
