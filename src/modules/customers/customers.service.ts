import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { UsersService } from '@modules/users/users.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CustomerPaginationDto, CreateCustomerDto, UpdateCustomerDto, ResponseCustomerDto } from './dto';
import { CustomerWithRelations } from './interfaces';
import { UserResponseDto } from '@modules/users/dto';
import { ResponseLoanDto } from '@modules/loans/dto';

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
        paymentAmount: loan.paymentAmount?.toNumber() ?? 0,
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
        return { ...customer, createdAt: now, updatedAt: now };
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

  async update(id: number, data: UpdateCustomerDto) {
    const existing = await this.findOne(id);
    const userId = existing.user?.id ?? null;
    const changes = this.detectChanges(existing, data);
    if (Object.keys(changes).length === 0) throw new BadRequestException('No se detectaron cambios.');

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

    // Validaciones de unicidad previas
    if (documentNumber !== undefined) {
      const docExists = await this.prisma.customer.findUnique({ where: { documentNumber: Number(documentNumber) } });
      if (docExists && docExists.id !== id)
        throw new BadRequestException('El número de documento ya está registrado.');
    }
    if (email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email } });
      if (emailExists && emailExists.id !== userId)
        throw new BadRequestException('El email ya está registrado.');
    }

    const updateData: Prisma.CustomerUpdateInput = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
      ...(documentNumber !== undefined && { documentNumber: Number(documentNumber) }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(isActive !== undefined && { isActive }),
      ...(typeDocumentIdentificationId && { typeDocumentIdentification: { connect: { id: typeDocumentIdentificationId } } }),
      ...(genderId && { gender: { connect: { id: genderId } } }),
      ...(zoneId && { zone: { connect: { id: zoneId } } }),
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

      type UserUpdateDto = { password?: string; name?: string; email?: string };
      const userUpdate: UserUpdateDto = {};
      let updateUser = false;

      if (documentNumber !== undefined) { userUpdate.password = String(documentNumber); updateUser = true; }
      if (firstName !== undefined || lastName !== undefined) {
        userUpdate.name = `${firstName ?? existing.customer.firstName} ${lastName ?? existing.customer.lastName}`.trim();
        updateUser = true;
      }
      if (email) { userUpdate.email = email; updateUser = true; }
      if (updateUser && userId) await this.usersService.update(userId, userUpdate);

      const audit = await this.changesService.getChanges('customer', id);
      const createdAt = audit.create?.timestamp || audit.lastUpdate?.timestamp || null;
      const updatedAt = audit.lastUpdate?.timestamp || createdAt;

      return { ...updated, createdAt, updatedAt };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('documentNumber')) throw new BadRequestException('El número de documento ya está registrado.');
        if (target.includes('email')) throw new BadRequestException('El email ya está registrado.');
        throw new BadRequestException('Violación de restricción única.');
      }
      throw err;
    }
  }

  private detectChanges(existingCustomer: any, data: UpdateCustomerDto): Partial<UpdateCustomerDto> {
    const changes: Partial<UpdateCustomerDto> = {};
    for (const key in data) {
      const typedKey = key as keyof UpdateCustomerDto;
      const newValue = data[typedKey];
      if (newValue === undefined) continue;

      if (typedKey === 'email') {
        const oldEmail = existingCustomer.user?.email;
        if (newValue !== oldEmail) changes.email = newValue as string;
        continue;
      }
      if (typedKey === 'birthDate') {
        const oldValue = existingCustomer[typedKey];
        const oldDateStr = oldValue instanceof Date ? oldValue.toISOString().split('T')[0] : oldValue;
        const newDateStr = typeof newValue === 'string' ? newValue.split('T')[0] : newValue;
        if (oldDateStr !== newDateStr) changes[typedKey] = newValue as string;
        continue;
      }
      const oldValue = existingCustomer[typedKey];
      if (newValue !== oldValue) changes[typedKey] = newValue as any;
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