import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Prisma } from '@prisma/client';

 /**
 * Servicio para la gestión de empresas
 * 
 * Este servicio maneja todas las operaciones relacionadas con la información corporativa:
 * - Registro y actualización de datos de la empresa
 * - Gestión de logos e imagen corporativa
 * - Configuración de información de contacto
 * - Datos tributarios y de identificación
 * 
 * La información de empresas es fundamental para:
 * - Personalización de la aplicación con datos corporativos
 * - Generación de documentos oficiales y contratos
 * - Configuración de imagen de marca en la interfaz
 * - Cumplimiento de requisitos legales y tributarios
 * - Información de contacto para clientes y terceros
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Obtiene todas las empresas registradas
   * 
   * @returns Promise<Company[]> Lista de empresas
   */
  async findAll() {
    const companies = await this.prisma.company.findMany();
    return companies.map(this.formatCompany);
  }

  /**
   * Obtiene una empresa específica por su ID
   * 
   * @param id ID de la empresa
   * @returns Promise<Company> La empresa encontrada
   * @throws {NotFoundException} Si la empresa no existe
   */
  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    return company ? this.formatCompany(company) : null;
  }

  /**
   * Crea una nueva empresa en el sistema
   * 
   * @param data Datos de la empresa a crear
   * @param file Archivo de logo (opcional)
   * @returns Promise<Company> La empresa creada
   */
  async create(data: CreateCompanyDto, file: Express.Multer.File) {
    const logoUrl = file ? `logos/${file.filename}` : undefined;

    // 🔎 Validación previa para campos únicos
    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [
          { name: data.name },
          { nit: BigInt(data.nit) },
          ...(data.phone ? [{ phone: data.phone }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existing) {
      let conflictField: string | undefined;
      if (existing.name === data.name) conflictField = 'name';
      else if (existing.nit === BigInt(data.nit)) conflictField = 'nit';
      else if (data.phone && existing.phone === data.phone) conflictField = 'phone';
      else if (data.email && existing.email === data.email) conflictField = 'email';

      if (conflictField) {
        throw new Error(`Ya existe una empresa con el mismo valor en el campo único: ${conflictField}`);
      } else {
        throw new Error('Ya existe una empresa con un valor duplicado en un campo único.');
      }
    }

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

    return this.formatCompany(newCompany);
  }

  /**
   * Actualiza una empresa existente
   * 
   * @param id ID de la empresa a actualizar
   * @param data Datos a actualizar
   * @param file Nuevo archivo de logo (opcional)
   * @returns Promise<Company> La empresa actualizada
   * @throws {NotFoundException} Si la empresa no existe
   */
  async update(id: number, data: UpdateCompanyDto, file?: Express.Multer.File) {
    const current = await this.prisma.company.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Empresa con ID ${id} no encontrada`);

    const changes = this.detectCompanyChanges(current, data, file);

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No se detectaron cambios en los datos de la empresa');
    }

    try {
      const updatedCompany = await this.prisma.company.update({
        where: { id },
        data: changes,
      });
      return this.formatCompany(updatedCompany);
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

  private detectCompanyChanges(
    current: any,
    data: UpdateCompanyDto,
    file?: Express.Multer.File
  ): Prisma.CompanyUpdateInput {
    const changes: Prisma.CompanyUpdateInput = {};

    // Logo
    if (file) {
      const oldPath = join(process.cwd(), 'public', current.logoUrl ?? '');
      if (current.logoUrl && existsSync(oldPath)) unlinkSync(oldPath);
      changes.logoUrl = `logos/${file.filename}`;
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
        changes.nit = newNit; // 👈 ya es bigint
      }
    }

    return changes;
  }

  // 👇 helper para BigInt → string
  private formatCompany(company: any) {
    return {
      ...company,
      nit: company.nit.toString(),
    };
  }
}
