import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { UsersService } from '@modules/users/users.service';
import { Customer, Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CustomerPaginationDto, CreateCustomerDto, UpdateCustomerDto, ResponseCustomerDto } from './dto';
import { ResponseLoanDto } from '@modules/loans/dto';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';


@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly changesService: ChangesService,
  ) { }

  async findAll(paginationDto: CustomerPaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where: Prisma.CustomerWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    const totalItems = await this.prisma.customer.count({ where });

    if (totalItems === 0) {
      return {
        customers: [], // Cambié rawCustomers a customers para consistencia
        meta: {
          total: 0,
          page: 1,
          lastPage: 0,
          limit,
          hasNextPage: false,
        },
      };
    }

    const lastPage = Math.ceil(totalItems / limit || 1);
    if (page > lastPage) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawCustomers = await this.prisma.customer.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { id: 'asc' },
      include: {
        user: true,        // Incluir relación user
        zone: true,
        typeDocumentIdentification: true,
        gender: true,
      },
    });

    const customersWithAudit = await Promise.all(
      rawCustomers.map(async (customer) => {
        const dto = this.buildCustomerResponse(customer);
        const { create, lastUpdate } = await this.changesService.getChanges('customer', customer.id);
        return {
          ...dto,
          createdAt: create?.timestamp || null,
          updatedAt: lastUpdate?.timestamp || create?.timestamp || null,
        };
      }),
    );

    return {
      customers: customersWithAudit, // Nombre más descriptivo
      meta: {
        total: totalItems,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage,
      },
    };
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        zone: true,
        typeDocumentIdentification: true,
        gender: true,
        loans: {
          where: { isActive: true },
          include: {
            interestRate: true,
            term: true,
            paymentFrequency: true,
            loanType: true,
            loanStatus: true,
          },
        },
      },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    // Timestamps del cliente
    const { create, lastUpdate } = await this.changesService.getChanges('customer', id);

    // Construir loans con timestamps
    const loans: ResponseLoanDto[] = [];
    for (const loan of customer.loans || []) {
      const loanChanges = await this.changesService.getChanges('loan', loan.id);

      loans.push({
        id: loan.id,
        customerId: loan.customerId,
        loanAmount: loan.loanAmount.toNumber(),
        remainingBalance: loan.remainingBalance.toNumber(),
        interestRateId: loan.interestRateId,
        interestRateValue: loan.interestRate?.value.toNumber() ?? 0,
        termId: loan.termId,
        termValue: loan.term?.value ?? 0,
        paymentFrequencyId: loan.paymentFrequencyId,
        paymentFrequencyName: loan.paymentFrequency?.name || '',
        loanTypeId: loan.loanTypeId,
        loanTypeName: loan.loanType?.name || '',
        loanStatusId: loan.loanStatusId,
        loanStatusName: loan.loanStatus?.name || '',
        startDate: loan.startDate?.toISOString().split('T')[0] || '',
        nextDueDate: loan.nextDueDate?.toISOString().split('T')[0] || undefined,
        isActive: loan.isActive,
        createdAt: loanChanges.create?.timestamp?.toISOString() || '',
        updatedAt: loanChanges.lastUpdate?.timestamp?.toISOString() || loanChanges.create?.timestamp?.toISOString() || '',
      });
    }

    // Construir user crudo
    const user = customer.user
      ? {
        id: customer.user.id,
        email: customer.user.email,
        name: customer.user.name,
      }
      : null;

    // Construir customer crudo (sin user)
    const customerObj = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      typeDocumentIdentificationId: customer.typeDocumentIdentificationId,
      typeDocumentIdentificationName: customer.typeDocumentIdentification.name || null,
      typeDocumentIdentificationCode: customer.typeDocumentIdentification.code || null,
      documentNumber: customer.documentNumber,
      genderId: customer.genderId,
      genderName: customer.gender?.name || null,
      birthDate: customer.birthDate,
      address: customer.address,
      phone: customer.phone,
      email: customer.user?.email,
      zoneId: customer.zoneId || 0,
      zoneName: customer.zone?.name || null,
      zoneCode: customer.zone?.code || null,
      createdAt: create?.timestamp?.toISOString() || null,
      updatedAt: lastUpdate?.timestamp?.toISOString() || create?.timestamp?.toISOString() || null,
    };

    return { customer: customerObj, loans, user };
  }

  async create(data: CreateCustomerDto) {
    // Validaciones previas para evitar gastar la transacción si ya existen
    const [existingDoc, existingEmail] = await Promise.all([
      this.prisma.customer.findUnique({ where: { documentNumber: Number(data.documentNumber) } }),
      this.prisma.user.findUnique({ where: { email: data.email } }),
    ]);

    if (existingDoc) {
      throw new BadRequestException('El número de documento ya está registrado.');
    }
    if (existingEmail) {
      throw new BadRequestException('El email ya está registrado.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(String(data.documentNumber), 10);

        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: `${data.firstName} ${data.lastName}`.trim(),
          },
        });

        const customer = await tx.customer.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            documentNumber: Number(data.documentNumber),
            birthDate: new Date(data.birthDate),
            phone: data.phone,
            address: data.address,
            typeDocumentIdentification: { connect: { id: data.typeDocumentIdentificationId } },
            gender: { connect: { id: data.genderId } },
            zone: data.zoneId ? { connect: { id: data.zoneId } } : undefined,
            user: { connect: { id: user.id } },
          },
          include: {
            user: true,
            zone: true,
            typeDocumentIdentification: true,
            gender: true,
          },
        });

        const now = new Date();
        const created = {
          createdAt: now,
          updatedAt: now,
        };

        const mapCustomer = {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.user?.email,
          typeDocumentIdentificationId: customer.typeDocumentIdentificationId,
          typeDocumentIdentificationName: customer.typeDocumentIdentification.name || null,
          typeDocumentIdentificationCode: customer.typeDocumentIdentification.code || null,
          documentNumber: customer.documentNumber,
          birthDate: customer.birthDate.toISOString().split('T')[0],
          genderId: customer.genderId,
          genderCode: customer.gender?.code || null,
          genderName: customer.gender?.name || null,
          zoneId: customer.zoneId || null,
          zoneName: customer.zone?.name || null,
          zoneCode: customer.zone?.code || null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        }

        return mapCustomer;
      });
    } catch (err: any) {
      // Captura de errores únicos (por si se produce condición de carrera)
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('documentNumber')) {
          throw new BadRequestException('El número de documento ya está registrado.');
        }
        if (target.includes('email')) {
          throw new BadRequestException('El email ya está registrado.');
        }
        throw new BadRequestException('Violación de restricción única.');
      }
      throw err;
    }
  }

  async createMany(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo no proporcionado');
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    let records: Record<string, any>[] = [];

    if (ext === 'csv') {
      const content = file.buffer.toString('utf8');
      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        throw new BadRequestException(`Error en CSV: ${parsed.errors[0].message}`);
      }
      records = parsed.data as Record<string, any>[];
    } else if (ext === 'xls' || ext === 'xlsx') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      throw new BadRequestException('Formato de archivo no soportado. Use CSV o XLSX.');
    }

    if (!records.length) {
      throw new BadRequestException('El archivo está vacío');
    }

    const results: any[] = [];
    const errors: { row: number; field?: string; value?: any; message: string; type?: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      const dto: CreateCustomerDto = {
        firstName: row['Nombres']?.trim(),
        lastName: row['Apellidos']?.trim(),
        email: row['Correo']?.toLowerCase() || undefined,
        documentNumber: row['Número de documento'],
        birthDate: row['Fecha de nacimiento'],
        phone: row['Teléfono'] ? String(row['Teléfono']).replace(/\D/g, '') : '',
        address: `${row['Dirección']}${row['Barrio'] ? ', ' + row['Barrio'] : ''}`,
        typeDocumentIdentificationId: Number(row['Tipo de documento']),
        genderId: Number(row['Género']),
        zoneId: row['Zona'] ? Number(row['Zona']) : undefined,
      };

      // Validaciones mínimas
      if (!dto.firstName) {
        errors.push({ row: i + 2, field: 'Nombres', value: row['Nombres'], message: 'El nombre es obligatorio' });
        continue;
      }
      if (!dto.documentNumber) {
        errors.push({ row: i + 2, field: 'Número de documento', value: row['Número de documento'], message: 'El número de documento es obligatorio' });
        continue;
      }

      try {
        const created = await this.create(dto);

        // 🔥 Formateamos aquí mismo antes de pushear
        results.push({
          id: created.id,
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
          typeDocumentIdentificationId: created.typeDocumentIdentificationId,
          typeDocumentIdentificationName: created.typeDocumentIdentificationName,
          typeDocumentIdentificationCode: created.typeDocumentIdentificationCode,
          documentNumber: created.documentNumber,
          birthDate: created.birthDate,
          genderId: created.genderId,
          genderName: created.genderName,
          zoneId: created.zoneId,
          zoneName: created.zoneName,
          zoneCode: created.zoneCode,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        });
      } catch (err: any) {
        let field: string | undefined;
        let value: string | number | undefined;
        let message = err.message;
        let type: string | undefined;

        if (message.includes('documento')) {
          field = 'Número de documento';
          value = dto.documentNumber;
          type = 'duplicate_document';
        } else if (message.includes('correo') || message.includes('email')) {
          field = 'Correo';
          value = dto.email ?? '';
          type = 'duplicate_email';
        }

        errors.push({ row: i + 2, field, value, message, type });
      }
    }

    return {
      results,
      firstCreated: results[0],        // Primer cliente creado
      lastCreated: results[results.length - 1], // Último cliente creado
      totalCreated: results.length,   // Nº de clientes creados correctamente
      totalErrors: errors.length,     // Nº de errores
      errors: errors.length > 0 ? errors : undefined, // Solo incluimos si hay errores
    };
  }

  async update(id: number, data: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: { user: true, zone: true, typeDocumentIdentification: true, gender: true },
    });

    if (!existing) {
      throw new NotFoundException('Cliente no encontrado.');
    }

    const userId = existing.userId ?? null;

    // Detectar cambios correctamente
    const changes = this.detectChanges(existing, data);
    // Si no hay cambios, lanzar excepción
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No se detectaron cambios.');
    }

    const {
      email,
      firstName,
      lastName,
      birthDate,
      documentNumber,
      phone,
      address,
      typeDocumentIdentificationId,
      genderId,
      zoneId,
      isActive,
    } = changes;

    // Validaciones previas de unicidad
    if (documentNumber !== undefined) {
      const docExists = await this.prisma.customer.findUnique({
        where: { documentNumber: Number(documentNumber) },
      });
      if (docExists && docExists.id !== id) {
        throw new BadRequestException('El número de documento ya está registrado.');
      }
    }

    if (email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email } });
      if (emailExists && emailExists.id !== userId) {
        throw new BadRequestException('El email ya está registrado.');
      }
    }

    const updateData: Prisma.CustomerUpdateInput = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
      ...(documentNumber !== undefined && { documentNumber: Number(documentNumber) }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(isActive !== undefined && { isActive }),
      ...(typeDocumentIdentificationId !== undefined && {
        typeDocumentIdentification: { connect: { id: typeDocumentIdentificationId } },
      }),
      ...(genderId !== undefined && { gender: { connect: { id: genderId } } }),
      ...(zoneId !== undefined && { zone: { connect: { id: zoneId } } }),
    };

    try {
      const updated = await this.prisma.customer.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          zone: true,
          typeDocumentIdentification: true,
          gender: true,
        },
      });

      // Actualizamos usuario si aplica
      type UserUpdateDto = { password?: string; name?: string; email?: string };
      const userUpdate: UserUpdateDto = {};
      let updateUser = false;

      if (documentNumber !== undefined) {
        userUpdate.password = String(documentNumber);
        updateUser = true;
      }

      if (firstName !== undefined || lastName !== undefined) {
        userUpdate.name = `${firstName ?? existing.firstName} ${lastName ?? existing.lastName}`.trim();
        updateUser = true;
      }

      if (email) {
        userUpdate.email = email;
        updateUser = true;
      }

      if (updateUser && userId) {
        await this.usersService.update(userId, userUpdate);
      }

      const audit = await this.changesService.getChanges('customer', id);
      const createdAt = audit.create?.timestamp || audit.lastUpdate?.timestamp || null;
      const updatedAt = audit.lastUpdate?.timestamp || createdAt;

      return {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.user?.email,
        typeDocumentIdentificationId: updated.typeDocumentIdentificationId,
        typeDocumentIdentificationName: updated.typeDocumentIdentification?.name || null,
        typeDocumentIdentificationCode: updated.typeDocumentIdentification?.code || null,
        documentNumber: updated.documentNumber,
        birthDate: updated.birthDate.toISOString().split('T')[0],
        genderId: updated.genderId,
        genderName: updated.gender?.name || null,
        phone: updated.phone,
        address: updated.address,
        zoneId: updated.zoneId || null,
        zoneName: updated.zone?.name || null,
        zoneCode: updated.zone?.code || null,
        isActive: updated.isActive,
        createdAt,
        updatedAt,
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('documentNumber'))
          throw new BadRequestException('El número de documento ya está registrado.');
        if (target.includes('email'))
          throw new BadRequestException('El email ya está registrado.');
        throw new BadRequestException('Violación de restricción única.');
      }
      throw err;
    }
  }

  private detectChanges(
    existing: Customer & { user: User | null },
    update: Partial<UpdateCustomerDto>
  ) {
    const changes: Partial<UpdateCustomerDto> = {};

    for (const key in update) {
      const typedKey = key as keyof UpdateCustomerDto;
      let newValue = update[typedKey];
      if (newValue === undefined || newValue === null) continue;

      // Comparar email con user.email
      let oldValue: any;
      if (typedKey === 'email') {
        oldValue = existing.user?.email || null;
      } else {
        oldValue = existing[typedKey as keyof Customer];
      }

      // Normalizar strings
      if (typeof newValue === 'string') {
        newValue = newValue.trim().toLowerCase();
        oldValue = typeof oldValue === 'string' ? oldValue.trim().toLowerCase() : oldValue;
      }

      // Normalizar números
      if (['documentNumber', 'typeDocumentIdentificationId', 'genderId', 'zoneId'].includes(key)) {
        newValue = Number(newValue);
        oldValue = oldValue !== null && oldValue !== undefined ? Number(oldValue) : oldValue;
      }

      // Comparar fechas
      if (key === 'birthDate') {
        const newDate = new Date(newValue as string).toISOString().split('T')[0];
        const oldDate = existing.birthDate ? existing.birthDate.toISOString().split('T')[0] : null;
        if (newDate !== oldDate) changes[typedKey] = newValue as any;
        continue;
      }

      if (oldValue !== newValue) {
        changes[typedKey] = newValue as any;
      }
    }

    // Comparar isActive explícitamente
    if (
      update.isActive !== undefined &&
      update.isActive !== null &&
      update.isActive !== existing.isActive
    ) {
      changes.isActive = update.isActive;
    }

    return changes;
  }

  private buildCustomerResponse(customer: any): ResponseCustomerDto {
    // Verificar si existe la relación user
    const userEmail = customer.user ? customer.user.email : null;

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: userEmail,
      typeDocumentIdentificationId: customer.typeDocumentIdentificationId,
      typeDocumentIdentificationName: customer.typeDocumentIdentification?.name || null,
      typeDocumentIdentificationCode: customer.typeDocumentIdentification?.code || null,
      documentNumber: customer.documentNumber,
      birthDate: customer.birthDate.toISOString().split('T')[0],
      genderId: customer.genderId,
      genderName: customer.gender?.name || null,
      phone: customer.phone,
      address: customer.address,
      zoneId: customer.zoneId || null,
      zoneName: customer.zone?.name || null,
      zoneCode: customer.zone?.code || null,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }
}