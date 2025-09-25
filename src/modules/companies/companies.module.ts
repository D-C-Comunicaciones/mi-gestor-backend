import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

/**
 * Módulo de empresas
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con la gestión de empresas:
 * 
 * Responsabilidades:
 * - Registro y gestión de información corporativa
 * - Manejo de logos e imagen de marca
 * - Configuración de datos de contacto y tributarios
 * - Personalización de la interfaz con datos empresariales
 * 
 * Dependencias:
 * - PrismaModule: Para acceso a la base de datos
 * - MulterModule: Para manejo de archivos (logos)
 * 
 * Exportaciones:
 * - CompaniesService: Para uso en otros módulos que requieran datos corporativos
 * 
 * Casos de uso principales:
 * 1. Configuración inicial del sistema con datos de la empresa
 * 2. Personalización de marca en documentos y reportes
 * 3. Información de contacto en comunicaciones con clientes
 * 4. Cumplimiento de requisitos legales en documentación
 * 5. Configuración de imagen corporativa en la interfaz
 * 
 * Integración con otros módulos:
 * - ReportsModule: Datos corporativos en documentos generados
 * - ContractsModule: Información legal y tributaria en contratos
 * - NotificationsModule: Datos de contacto para comunicaciones
 * - ConfigurationsModule: Integración con configuración general
 * 
 * Características de gestión de archivos:
 * - Subida de logos en formato PNG, JPG, JPEG
 * - Almacenamiento en directorio público accesible
 * - Reemplazo automático de logos existentes
 * - Validación de tipos de archivo y tamaños
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Module({
  imports: [
    PrismaModule, // Acceso a la base de datos
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [
    CompaniesService, // Exportado para uso en módulos de Reports y Contracts
  ],
})
export class CompaniesModule {}
