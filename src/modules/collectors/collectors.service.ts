import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CollectorPaginationDto, CreateCollectorDto, UpdateCollectorDto } from './dto';
import { Prisma } from '@prisma/client';
import { UsersService } from '@modules/users/users.service';
import * as bcrypt from 'bcrypt';
import { ChangesService } from '@modules/changes/changes.service';

@Injectable()
export class CollectorsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private readonly changesService: ChangesService,
  ) { }

  async findAll(paginationDto: CollectorPaginationDto) {
    const { page = 1, limit = 10, isActive, assigned } = paginationDto;

    const where: Prisma.CollectorWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    if (typeof assigned === 'boolean') {
      where.routes = assigned ? { some: {} } : { none: {} };
    }

    const totalItems = await this.prisma.collector.count({ where });
    const lastPage = Math.ceil(totalItems / limit || 1);

    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawCollectors = await this.prisma.collector.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { id: 'asc' },
      include: { 
        user: true,
        typeDocumentIdentification: true,
        gender: true
      },
    });

    // Por cada collector, obtener createdAt y updatedAt de cambios
    const collectorsWithChanges = await Promise.all(
      rawCollectors.map(async (collector) => {
        const { create, lastUpdate } = await this.changesService.getChanges('collector', collector.id);

        return {
          ...collector,
          createdAt: create?.timestamp || null,
          updatedAt: lastUpdate?.timestamp || create?.timestamp || null,
        };
      })
    );

    return {
      rawCollectors: collectorsWithChanges,
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
    const collector = await this.prisma.collector.findUnique({
      where: { id },
      include: { 
        user: true,
        typeDocumentIdentification: true,
        gender: true,
        routes: true // Incluir las rutas asignadas al cobrador
      },
    });
    if (!collector) throw new NotFoundException('Cobrador no encontrado');

    const { create, lastUpdate } = await this.changesService.getChanges('collector', id);

    return {
      ...collector,
      createdAt: create?.timestamp || null,
      updatedAt: lastUpdate?.timestamp || create?.timestamp || null,
    };
  }

  async create(data: CreateCollectorDto) {

    // Validaciones previas
    const [existingDoc, existingEmail] = await Promise.all([
      this.prisma.collector.findUnique({ where: { documentNumber: data.documentNumber } }),
      this.prisma.user.findUnique({ where: { email: data.email } }),
    ]);

    if (existingDoc) throw new BadRequestException('El número de documento ya está registrado.');
    if (existingEmail) throw new BadRequestException('El email ya está registrado.');

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Hash dentro de la transacción no afecta la atomicidad (solo CPU)
        const hashedPassword = await bcrypt.hash(String(data.documentNumber), 10);

        // Crear usuario dentro de la transacción
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: `${data.firstName} ${data.lastName}`,
            roleId: 2,
          },
        });

        // Crear collector ligado al user recién creado (si esto falla se revierte el user)
        const collector = await tx.collector.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            documentNumber: data.documentNumber,
            birthDate: new Date(data.birthDate),
            phone: data.phone,
            address: data.address,
            typeDocumentIdentification: { connect: { id: data.typeDocumentIdentificationId } },
            gender: { connect: { id: data.genderId } },
            user: { connect: { id: user.id } },
          },
          include: { 
            user: true,
            typeDocumentIdentification: true,
            gender: true
          },
        });

        const now = new Date();
        return {
          ...collector,
          createdAt: now,
          updatedAt: now,
        };
      });
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

  async update(id: number, data: UpdateCollectorDto) {
    const collector = await this.findOne(id);
    const changes = this.detectChanges(collector, data);

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No se detectaron cambios.');
    }

    // Validaciones de unicidad previas
    if (changes.documentNumber !== undefined) {
      const docExists = await this.prisma.collector.findUnique({ where: { documentNumber: changes.documentNumber } });
      if (docExists && docExists.id !== id) throw new BadRequestException('El número de documento ya está registrado.');
    }
    if (changes.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: changes.email } });
      if (emailExists && emailExists.id !== collector.userId)
        throw new BadRequestException('El email ya está registrado.');
    }

    const {
      typeDocumentIdentificationId,
      genderId,
      email,
      ...restChanges
    } = changes;

    const updateData: Prisma.CollectorUpdateInput = {
      ...restChanges,
      ...(typeDocumentIdentificationId && { typeDocumentIdentification: { connect: { id: typeDocumentIdentificationId } } }),
      ...(genderId && { gender: { connect: { id: genderId } } }),
    };

    try {
      const updatedCollector = await this.prisma.collector.update({
        where: { id },
        data: updateData,
        include: { 
          user: true,
          typeDocumentIdentification: true,
          gender: true,
          routes: true
        },
      });

      type UserUpdateDto = { password?: string; name?: string; email?: string; };
      const userUpdateDto: UserUpdateDto = {};
      let shouldUpdateUser = false;

      if (changes.documentNumber !== undefined) {
        userUpdateDto.password = String(changes.documentNumber);
        shouldUpdateUser = true;
      }
      if (changes.firstName !== undefined || changes.lastName !== undefined) {
        const firstName = changes.firstName ?? collector.firstName;
        const lastName = changes.lastName ?? collector.lastName;
        userUpdateDto.name = `${firstName} ${lastName}`;
        shouldUpdateUser = true;
      }
      if (email) {
        userUpdateDto.email = email;
        shouldUpdateUser = true;
      }
      if (shouldUpdateUser && collector.userId) {
        await this.usersService.update(collector.userId, userUpdateDto);
      }

      const auditChanges = await this.changesService.getChanges('collector', id);
      const createdAt = auditChanges.create?.timestamp || auditChanges.lastUpdate?.timestamp || null;
      const updatedAt = auditChanges.lastUpdate?.timestamp || createdAt;

      return { ...updatedCollector, createdAt, updatedAt };
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

  private detectChanges(existingCollector: any, data: UpdateCollectorDto): Partial<UpdateCollectorDto> {
    const changes: Partial<UpdateCollectorDto> = {};
    for (const key in data) {
      const typedKey = key as keyof UpdateCollectorDto;
      const newValue = data[typedKey];
      if (newValue === undefined) continue;

      if (typedKey === 'email') {
        const oldEmail = existingCollector.user?.email;
        if (newValue !== oldEmail) changes.email = newValue as string;
        continue;
      }
      if (typedKey === 'birthDate') {
        const oldValue = existingCollector[typedKey];
        const oldDateStr = oldValue instanceof Date ? oldValue.toISOString().split('T')[0] : oldValue;
        const newDateStr = typeof newValue === 'string' ? newValue.split('T')[0] : newValue;
        if (oldDateStr !== newDateStr) changes[typedKey] = newValue as string;
        continue;
      }
      const oldValue = existingCollector[typedKey];
      if (newValue !== oldValue) changes[typedKey] = newValue as any;
    }
    return changes;
  }

}
