import { Module } from '@nestjs/common';
import { AmortizationsController } from './amortizations.controller';
import { AmortizationsService } from './amortizations.service';

/**
 * Módulo de amortizaciones
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con cálculos de amortización:
 * 
 * Responsabilidades:
 * - Cálculo de tablas de amortización usando sistema francés
 * - Generación de cronogramas de pago detallados
 * - Simulación de préstamos para originación
 * - Cálculo preciso de cuotas y distribución capital/interés
 * 
 * Exportaciones:
 * - AmortizationsService: Para uso en otros módulos (Loans, Origination)
 * 
 * Casos de uso principales:
 * 1. Simulación de préstamos antes de la originación
 * 2. Generación de propuestas de financiamiento
 * 3. Cálculo de cuotas para diferentes escenarios
 * 4. Herramientas de asesoría comercial
 * 5. Validación de viabilidad financiera
 * 
 * Integración con otros módulos:
 * - LoansModule: Generación de cronogramas reales tras aprobación
 * - OriginationModule: Simulaciones durante proceso de solicitud
 * - CustomersModule: Cálculos para análisis de capacidad de pago
 * - ProductsModule: Simulaciones con parámetros de productos
 * 
 * Características del sistema de cálculo:
 * - Sistema francés (cuota fija): PMT constante
 * - Distribución variable: más interés al inicio, más capital al final
 * - Cálculos precisos con manejo de decimales
 * - Soporte para diferentes frecuencias de pago
 * - Validación de parámetros de entrada
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  controllers: [AmortizationsController],
  providers: [AmortizationsService],
  exports: [
    AmortizationsService, // Exportado para uso en módulos de Loans y Origination
  ],
})
export class AmortizationsModule {}
