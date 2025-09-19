import { Module } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { LoanTypesController } from './loan-types.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de tipos de crédito
 *
 * Este módulo encapsula toda la funcionalidad relacionada con los tipos de crédito:
 *
 * Responsabilidades:
 * - Gestión de tipos de crédito (CUOTA_FIJA, INTERES_MENSUAL, LINEA_CREDITO, etc.)
 * - Consulta de tipos activos para formularios de creación de préstamos
 * - Mantenimiento y configuración de nuevos tipos de productos financieros
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - LoanTypesService: Para uso en otros módulos (especialmente el módulo de préstamos)
 *
 * Casos de uso principales:
 * 1. Al crear un préstamo, se consultan los tipos disponibles
 * 2. Validación de que el tipo de crédito seleccionado esté activo
 * 3. Configuración de nuevos productos financieros por parte de administradores
 *
 * @version 1.0.0
 * @since 2025-01-04
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [LoanTypesController],
  providers: [LoanTypesService],
  exports: [
    LoanTypesService, // Exportado para uso en otros módulos, especialmente LoansModule
  ],
})
export class LoanTypesModule {}
