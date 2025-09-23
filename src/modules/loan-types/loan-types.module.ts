import { Module } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { LoanTypesController } from './loan-types.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de tipos de préstamo
 *
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de tipos de préstamo:
 *
 * Responsabilidades:
 * - Consulta del catálogo de productos de crédito disponibles
 * - Validación de características y parámetros por tipo de préstamo
 * - Mantenimiento de la configuración de productos
 * - Soporte para originación con diferentes modalidades de pago
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - LoanTypesService: Para uso en otros módulos (Loans, Origination)
 *
 * Casos de uso principales:
 * 1. Poblar formularios de originación con productos disponibles
 * 2. Validar parámetros según el tipo de préstamo seleccionado
 * 3. Configurar características específicas por producto
 * 4. Determinar rangos de montos y plazos permitidos
 * 5. Establecer modalidades de pago y características especiales
 *
 * Integración with otros módulos:
 * - LoansModule: Validación de tipos durante originación de créditos
 * - OriginationModule: Catálogo de productos para solicitudes
 * - GracePeriodsModule: Solo tipos Monthly permiten períodos de gracia
 * - InterestRatesModule: Cada tipo tiene su tasa específica
 * - ProductsModule: Configuración de características comerciales
 *
 * Características configurables por tipo:
 * - Modalidad de pago (Daily, Weekly, Biweekly, Monthly, etc.)
 * - Rangos de montos mínimos y máximos
 * - Plazos mínimos y máximos en la unidad de frecuencia
 * - Tasas de interés específicas por producto
 * - Soporte para períodos de gracia (solo Monthly)
 * - Requerimientos de garantías o avales
 * - Estados activos para control de productos descontinuados
 *
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [LoanTypesController],
  providers: [LoanTypesService],
  exports: [
    LoanTypesService, // Exportado para uso en módulos de Loans y Origination
  ],
})
export class LoanTypesModule {}
