import { Module } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { InterestRatesController } from './interest-rates.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de tasas de interés corriente
 *
 * Este módulo encapsula toda la funcionalidad relacionada con las tasas de interés:
 *
 * Responsabilidades:
 * - Gestión de tasas de interés (2.5% mensual, 3.0% mensual, etc.)
 * - Consulta de tasas activas para formularios de creación de préstamos
 * - Consulta de tasas para procesos de refinanciación
 * - Cálculo de intereses mensuales para simulaciones
 * - Mantenimiento y configuración de nuevas tasas
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - InterestRatesService: Para uso en otros módulos (especialmente Loans y Refinancing)
 *
 * Casos de uso principales:
 * 1. Al crear un préstamo, se consultan las tasas disponibles
 * 2. En procesos de refinanciación, se selecciona nueva tasa
 * 3. Para simulaciones de crédito se calculan intereses
 * 4. Validación de que la tasa seleccionada esté activa
 * 5. Configuración de nuevos productos financieros por administradores
 *
 * Integración con otros módulos:
 * - LoansModule: Usa las tasas para calcular cuotas e intereses
 * - RefinancingModule: Consulta tasas para nuevos términos
 * - SimulationsModule: Calcula proyecciones de pago
 *
 * @version 1.0.0
 * @since 2025-01-04
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [InterestRatesController],
  providers: [InterestRatesService],
  exports: [
    InterestRatesService, // Exportado para uso en LoansModule y otros módulos relacionados
  ],
})
export class InterestRatesModule {}
