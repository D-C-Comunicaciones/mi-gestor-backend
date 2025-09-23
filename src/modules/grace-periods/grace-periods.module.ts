import { Module } from '@nestjs/common';
import { GracePeriodsService } from './grace-periods.service';
import { GracePeriodsController } from './grace-periods.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de períodos de gracia
 *
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de períodos de gracia:
 *
 * Responsabilidades:
 * - Consulta de períodos disponibles para créditos mensuales
 * - Validación de períodos de gracia en procesos de originación
 * - Mantenimiento del catálogo de períodos de gracia
 * - Soporte para productos de crédito diferenciados
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - GracePeriodsService: Para uso en otros módulos (Loans, Products)
 *
 * Casos de uso principales:
 * 1. Poblar listas desplegables en formularios de créditos mensuales
 * 2. Validar períodos seleccionados durante originación
 * 3. Configurar productos de crédito con opciones de gracia
 * 4. Calcular cronogramas de pago con períodos diferidos
 * 5. Generar reportes de utilización de períodos de gracia
 *
 * Integración con otros módulos:
 * - LoansModule: Aplicación de períodos de gracia en créditos mensuales
 * - ProductsModule: Configuración de productos con períodos disponibles
 * - InstallmentsModule: Generación de cronogramas con períodos diferidos
 * - OriginationModule: Selección de períodos durante solicitud
 *
 * Características de los períodos de gracia:
 * - Solo aplicables a créditos de modalidad mensual
 * - Durante el período se pagan únicamente intereses
 * - El capital se difiere hasta finalizar el período
 * - Configurables en meses (1, 3, 6, 12, etc.)
 * - Útiles para negocios estacionales o proyectos en desarrollo
 *
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [GracePeriodsController],
  providers: [GracePeriodsService],
  exports: [
    GracePeriodsService, // Exportado para uso en módulos de Loans y Products
  ],
})
export class GracePeriodsModule {}
