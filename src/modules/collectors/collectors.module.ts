import { Module } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CollectorsController } from './collectors.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { UsersModule } from '@modules/users/users.module';
import { ChangesModule } from '@modules/changes/changes.module';

/**
 * Módulo de cobradores
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de cobradores:
 * 
 * Responsabilidades:
 * - Registro y gestión de personal de cobranza
 * - Asignación de zonas y rutas de trabajo
 * - Control de activación/desactivación de cobradores
 * - Integración con sistema de usuarios para autenticación
 * - Auditoría de cambios en información de cobradores
 * 
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 * - UsersModule: Para creación y gestión de usuarios asociados
 * - ChangesModule: Para auditoría de cambios
 * 
 * Exportaciones:
 * - CollectorsService: Para uso en otros módulos (especialmente Collections)
 * 
 * Casos de uso principales:
 * 1. Administración de personal de cobranza
 * 2. Asignación territorial por zonas
 * 3. Control de acceso al sistema móvil de cobranza
 * 4. Trazabilidad de recaudos por cobrador
 * 5. Reportes de desempeño del personal
 * 
 * Integración con otros módulos:
 * - CollectionsModule: Los cobradores registran recaudos
 * - UsersModule: Cada cobrador tiene un usuario para autenticación
 * - ZonesModule: Asignación territorial de cobradores
 * - ReportsModule: Análisis de desempeño por cobrador
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  imports: [
    PrismaModule, // Acceso a base de datos
    UsersModule, // Gestión de usuarios asociados
    ChangesModule, // Auditoría de cambios
  ],
  controllers: [CollectorsController],
  providers: [CollectorsService],
  exports: [
    CollectorsService, // Exportado para uso en CollectionsModule y otros módulos
  ],
})
export class CollectorsModule {}
