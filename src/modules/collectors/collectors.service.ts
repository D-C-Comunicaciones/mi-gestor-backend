import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CollectorPaginationDto, CreateCollectorDto, UpdateCollectorDto } from './dto';
import { Prisma } from '@prisma/client';
import { UsersService } from '@modules/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CollectorsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) { }

  async findAll(paginationDto: CollectorPaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where: Prisma.CollectorWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

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
    });

    return {
      rawCollectors,
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
      include: { user: true, zone: true },
    });
    if (!collector) throw new NotFoundException('Collector not found');
    return collector;
  }

  async create(data) {
    // Crear usuario primero
    const hashedPassword = await bcrypt.hash(data.documentNumber, 10);
    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      name: `${data.firstName} ${data.lastName}`,
      roleId: 2, // roleId cobrador por defecto
    });

    // Crear collector con userId asignado y relaciones bien conectadas
    const collector = await this.prisma.collector.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        documentNumber: data.documentNumber,
        birthDate: data.birthDate,
        phone: data.phone,
        address: data.address,
        isActive: data.isActive !== undefined ? data.isActive : true,

        typeDocumentIdentification: {
          connect: { id: data.typeDocumentIdentificationId },
        },
        gender: {
          connect: { id: data.genderId },
        },
        zone: data.zoneId
          ? { connect: { id: data.zoneId } }
          : undefined,
        user: {
          connect: { id: user.id },  // Aquí conecta el user
        },
      },
      include: {
        user: true,
        zone: true,
      },
    });

    return collector;
  }

  async update(id: number, data: UpdateCollectorDto) {
    await this.findOne(id);
    const rawcollector = await this.prisma.collector.update({
      where: { id },
      data,
      include: { user: true, zone: true },
    });
    return rawcollector;
  }

}
