import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { join } from 'path';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ResponseCompanyDto } from './dto';

 /**
 * Servicio para la gestión de empresas
 * 
 * Este servicio maneja la información corporativa como un singleton:
 * - Solo puede existir una empresa registrada en el sistema
 * - Si se intenta crear y ya existe una, se actualiza automáticamente
 * - Los logos se retornan en formato base64 para facilitar su uso
 * - Gestión automática de archivos de imagen
 * 
 * La información de empresas es fundamental para:
 * - Personalización de la aplicación con datos corporativos
 * - Generación de documentos oficiales y contratos
 * - Configuración de imagen de marca en la interfaz
 * - Cumplimiento de requisitos legales y tributarios
 * 
 * @version 2.0.0
 * @since 2024-01-15
 */
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Obtiene la empresa registrada (singleton)
   */
  async findAll() {
    const companies = await this.prisma.company.findMany();
    const companiesWithBase64 = companies.map(company => this.formatCompanyWithBase64Logo(company));
    
    const companiesResponse = plainToInstance(ResponseCompanyDto, companiesWithBase64, {
      excludeExtraneousValues: true
    });

    const message = companiesResponse.length > 0 
      ? 'Información de la empresa' 
      : 'No hay empresa registrada en el sistema';

    return {
      message,
      companies: companiesResponse
    };
  }

  /**
   * Obtiene la empresa por ID
   */
  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    const companyWithBase64 = this.formatCompanyWithBase64Logo(company);
    const companyResponse = plainToInstance(ResponseCompanyDto, companyWithBase64, {
      excludeExtraneousValues: true
    });

    return {
      message: 'Detalle de la empresa',
      company: companyResponse
    };
  }

  /**
   * Crea o actualiza la empresa (comportamiento singleton)
   */
  async create(data: CreateCompanyDto, file?: Express.Multer.File) {
    this.logger.log('🏢 Intentando crear/actualizar empresa (modo singleton)');
    
    // Verificar si ya existe una empresa en el sistema
    const existingCompany = await this.prisma.company.findFirst();
    
    if (existingCompany) {
      this.logger.log(`📝 Empresa existente encontrada (ID: ${existingCompany.id}), actualizando...`);
      // Si existe, actualizar en lugar de crear
      return this.update(existingCompany.id, data, file);
    }

    // Si no existe, crear nueva empresa
    this.logger.log('🆕 No existe empresa, creando nueva...');
    const logoUrl = file ? `logos/${file.filename}` : undefined;

    const newCompany = await this.prisma.company.create({
      data: {
        name: data.name,
        nit: BigInt(data.nit),
        verificationDigit: data.verificationDigit
          ? parseInt(data.verificationDigit, 10)
          : null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        logoUrl,
      },
    });

    this.logger.log(`✅ Empresa creada exitosamente con ID: ${newCompany.id}`);
    
    const companyWithBase64 = this.formatCompanyWithBase64Logo(newCompany);
    const companyResponse = plainToInstance(ResponseCompanyDto, companyWithBase64, {
      excludeExtraneousValues: true
    });

    // Determinar el mensaje basado en si había empresa
    const existingCount = await this.prisma.company.count();
    const message = existingCount === 1 
      ? 'Empresa creada exitosamente' 
      : 'Empresa actualizada exitosamente (ya existía en el sistema)';

    return {
      message,
      company: companyResponse
    };
  }

  /**
   * Actualiza la empresa existente
   */
  async update(id: number, data: UpdateCompanyDto, file?: Express.Multer.File) {
    const current = await this.prisma.company.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Empresa con ID ${id} no encontrada`);

    const changes = this.detectCompanyChanges(current, data, file);

    if (Object.keys(changes).length === 0 && !file) {
      this.logger.warn('⚠️  No se detectaron cambios en los datos de la empresa');
      // En lugar de lanzar error, retornar la empresa actual
      const companyWithBase64 = this.formatCompanyWithBase64Logo(current);
      const companyResponse = plainToInstance(ResponseCompanyDto, companyWithBase64, {
        excludeExtraneousValues: true
      });

      return {
        message: 'Empresa actualizada exitosamente',
        company: companyResponse
      };
    }

    try {
      const updatedCompany = await this.prisma.company.update({
        where: { id },
        data: changes,
      });
      
      this.logger.log(`✅ Empresa actualizada exitosamente con ID: ${id}`);
      
      const companyWithBase64 = this.formatCompanyWithBase64Logo(updatedCompany);
      const companyResponse = plainToInstance(ResponseCompanyDto, companyWithBase64, {
        excludeExtraneousValues: true
      });

      return {
        message: 'Empresa actualizada exitosamente',
        company: companyResponse
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('email')) throw new BadRequestException('El email ya está registrado.');
        if (target.includes('nit')) throw new BadRequestException('El NIT ya está registrado.');
        throw new BadRequestException('Violación de restricción única.');
      }
      throw err;
    }
  }

  /**
   * Obtiene la empresa del sistema (método de conveniencia para singleton)
   * 
   * @returns Promise<Company | null> La empresa registrada o null si no existe
   */
  async getCompany() {
    const company = await this.prisma.company.findFirst();
    return company ? this.formatCompanyWithBase64Logo(company) : null;
  }

  private detectCompanyChanges(
    current: any,
    data: UpdateCompanyDto,
    file?: Express.Multer.File
  ): Prisma.CompanyUpdateInput {
    const changes: Prisma.CompanyUpdateInput = {};

    // Logo
    if (file) {
      const oldPath = join(process.cwd(), 'public', current.logoUrl ?? '');
      if (current.logoUrl && existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
          this.logger.log('🗑️  Logo anterior eliminado correctamente');
        } catch (error) {
          this.logger.warn(`⚠️  No se pudo eliminar el logo anterior: ${error.message}`);
        }
      }
      changes.logoUrl = `logos/${file.filename}`;
      this.logger.log(`📸 Nuevo logo configurado: ${changes.logoUrl}`);
    }

    // Comparaciones seguras
    if (data.name !== undefined && data.name.trim() !== current.name) {
      changes.name = data.name.trim();
    }
    if (data.phone !== undefined && data.phone !== current.phone) {
      changes.phone = data.phone;
    }
    if (data.email !== undefined && data.email !== current.email) {
      changes.email = data.email;
    }
    if (data.address !== undefined && data.address.trim() !== current.address) {
      changes.address = data.address.trim();
    }
    if (data.verificationDigit !== undefined) {
      const newValue = parseInt(data.verificationDigit as any, 10);
      if (newValue !== current.verificationDigit) {
        changes.verificationDigit = newValue;
      }
    }
    if (data.nit !== undefined) {
      const newNit = BigInt(data.nit);
      if (newNit !== current.nit) {
        changes.nit = newNit;
      }
    }

    return changes;
  }

  /**
   * Formatea la empresa y convierte el logo a base64
   * 
   * @param company Datos de la empresa desde la base de datos
   * @returns Empresa formateada con logo en base64
   */
  private formatCompanyWithBase64Logo(company: any) {
    const formatted = {
      ...company,
      nit: company.nit.toString(),
      logoBase64: null as string | null
    };

    // Convertir logo a base64 si existe
    if (company.logoUrl) {
      try {
        const logoPath = join(process.cwd(), 'public', company.logoUrl);
        if (existsSync(logoPath)) {
          const logoBuffer = readFileSync(logoPath);
          const logoExtension = company.logoUrl.split('.').pop()?.toLowerCase();
          const mimeType = this.getMimeType(logoExtension);
          formatted.logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
          this.logger.debug(`📷 Logo convertido a base64 para empresa ID: ${company.id}`);
        } else {
          this.logger.warn(`⚠️  Archivo de logo no encontrado: ${logoPath}`);
        }
      } catch (error) {
        this.logger.error(`❌ Error al leer logo: ${error.message}`);
      }
    }

    return formatted;
  }

  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   * 
   * @param extension Extensión del archivo
   * @returns Tipo MIME correspondiente
   */
  private getMimeType(extension?: string): string {
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp'
    };
    
    return mimeTypes[extension || ''] || 'image/png';
  }
}
