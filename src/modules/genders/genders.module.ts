import { Module } from '@nestjs/common';
import { GendersService } from './genders.service';
import { GendersController } from './genders.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de géneros
 *
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de géneros:
 *
 * Responsabilidades:
 * - Consulta de géneros disponibles para formularios de registro
 * - Validación de géneros en procesos de creación de entidades
 * - Mantenimiento del catálogo de géneros del sistema
 * - Soporte para clasificación demográfica
 *
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 *
 * Exportaciones:
 * - GendersService: Para uso en otros módulos (Customers, Collectors)
 *
 * Casos de uso principales:
 * 1. Poblar listas desplegables en formularios de registro
 * 2. Validar géneros seleccionados durante creación de entidades
 * 3. Generar reportes demográficos por género
 * 4. Mantener catálogo de géneros actualizado
 * 5. Soporte para normativas de inclusión y diversidad
 *
 * Integración con otros módulos:
 * - CustomersModule: Validación de género en registro de clientes
 * - CollectorsModule: Validación de género en registro de cobradores
 * - ReportsModule: Análisis demográfico por género
 * - FormsModule: Poblado de opciones en formularios
 *
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [GendersController],
  providers: [GendersService],
  exports: [
    GendersService, // Exportado para uso en módulos de Customers y Collectors
  ],
})
export class GendersModule {}
