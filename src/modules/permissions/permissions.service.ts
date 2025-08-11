import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto, UpdatePermissionDto, PermissionPaginationDto } from './dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { StatusDto } from '@common/dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreatePermissionDto) {
    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.permission.findUnique({
        where: { name: data.name },
      });

      if (exists) {
        throw new BadRequestException(`Ya existe un permiso con el nombre "${data.name}"`);
      }

      return tx.permission.create({ data });
    });
  }

  async findAll(paginationDto: PermissionPaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where: Prisma.PermissionWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    const totalItems = await this.prisma.permission.count({ where });
    const lastPage = Math.ceil(totalItems / limit || 1);

    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawPermissions = await this.prisma.permission.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { id: 'asc' },
    });

    return {
      rawPermissions,
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
    const permission = await this.prisma.permission.findUnique({ where: { id } });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return permission;
  }

  async update(id: number, data: UpdatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Permiso no encontrado');
    }

    const noChanges =
      data.name === existing.name &&
      data.description === existing.description;

    if (noChanges) {
      throw new BadRequestException('No se detectaron cambios');
    }

    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async changeStatus(id: number, status: StatusDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          where: { isActive: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    if (permission.isActive === status.status) {
      throw new BadRequestException(
        `El permiso ya está ${status.status ? 'activo' : 'desactivado'}`
      );
    }

    if (!status.status && permission.rolePermissions.length > 0) {
      throw new BadRequestException(
        'No se puede desactivar un permiso asignado a roles'
      );
    }

    return this.prisma.permission.update({
      where: { id },
      data: { isActive: status.status },
    });
  }
}