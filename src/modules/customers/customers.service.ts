import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { UsersService } from '@modules/users/users.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CustomerPaginationDto, CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly changesService: ChangesService,
  ) {}

  async findAll(paginationDto: CustomerPaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where: Prisma.CustomerWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    const totalItems = await this.prisma.customer.count({ where });

    // Si no hay registros devolver inmediatamente (similar a collectors lógica solicitada)
    if (totalItems === 0) {
      return {
        rawCustomers: [],
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
        user: true,
        zone: true,
        typeDocumentIdentification: true,
        gender: true,
      },
    });

    const customersWithAudit = await Promise.all(
      rawCustomers.map(async (customer) => {
        const { create, lastUpdate } = await this.changesService.getChanges('customer', customer.id);
        return {
          ...customer,
          createdAt: create?.timestamp || null,
          updatedAt: lastUpdate?.timestamp || create?.timestamp || null,
        };
      }),
    );

    return {
      rawCustomers: customersWithAudit,
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
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const { create, lastUpdate } = await this.changesService.getChanges('customer', id);

    return {
      ...customer,
      createdAt: create?.timestamp || null,
      updatedAt: lastUpdate?.timestamp || create?.timestamp || null,
    };
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
      if (emailExists && emailExists.id !== existing.userId)
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
        userUpdate.name = `${firstName ?? existing.firstName} ${lastName ?? existing.lastName}`.trim();
        updateUser = true;
      }
      if (email) { userUpdate.email = email; updateUser = true; }
      if (updateUser && existing.userId) await this.usersService.update(existing.userId, userUpdate);

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
}