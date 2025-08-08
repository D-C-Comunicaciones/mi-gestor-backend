import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'infraestructure/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignRevokePermissionDto, RolePaginationDto } from './dto';
import { StatusDto } from '@common/dto';
import { Permission } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: { name: data.name },
      });

      if (existingRole) {
        throw new BadRequestException(
          `Ya existe un rol con el nombre "${data.name}"`,
        );
      }

      return tx.role.create({ data });
    });
  }

  async findAll(paginationDto: RolePaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where = typeof isActive === 'boolean' ? { isActive } : {};

    const totalItems = await this.prisma.role.count({ where });
    const lastPage = Math.ceil(totalItems / limit || 1);

    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawRoles = await this.prisma.role.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { id: 'asc' },
    });

    return {
      rawRoles,
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
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async update(id: number, data: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Rol no encontrado');
    }

    const noChanges =
      data.name === existing.name &&
      data.description === existing.description;

    if (noChanges) {
      throw new BadRequestException('No se detectaron cambios');
    }

    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async changeStatus(id: number, status: StatusDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (status.status === role.isActive) {
      throw new BadRequestException(
        `El rol ya está ${status.status ? 'activo' : 'desactivado'}`
      );
    }

    if (!status.status && role.users.length > 0) {
      throw new BadRequestException(
        'No se puede desactivar un rol asignado a usuarios'
      );
    }

    return this.prisma.role.update({
      where: { id },
      data: { isActive: status.status },
    });
  }

  async assignPermissions(roleId: number, dto: AssignRevokePermissionDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissions } },
    });

    if (permissions.length !== dto.permissions.length) {
      const foundIds = permissions.map(p => p.id);
      const missingIds = dto.permissions.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`IDs de permisos inexistentes: ${missingIds.join(', ')}`);
    }

    const existing = await this.prisma.rolePermission.findMany({
      where: { roleId, permissionId: { in: dto.permissions } },
    });

    const toReactivate: number[] = [];
    const toCreate: number[] = [];

    for (const id of dto.permissions) {
      const match = existing.find(e => e.permissionId === id);
      if (match?.isActive) {
        throw new BadRequestException(
          `El permiso con ID ${id} ya está asignado al rol`
        );
      } else if (match && !match.isActive) {
        toReactivate.push(id);
      } else {
        toCreate.push(id);
      }
    }

    const reactivations = toReactivate.map(id =>
      this.prisma.rolePermission.update({
        where: { roleId_permissionId: { roleId, permissionId: id } },
        data: { isActive: true },
      })
    );

    const creations = toCreate.map(id =>
      this.prisma.rolePermission.create({
        data: { roleId, permissionId: id, isActive: true },
      })
    );

    await Promise.all([...reactivations, ...creations]);

    const updatedPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId, permissionId: { in: [...toReactivate, ...toCreate] } },
      include: { permission: true },
    });

    return {
      rawPermissions: updatedPermissions.map(rp => rp.permission),
    };
  }

  async revokePermissions(roleId: number, data: AssignRevokePermissionDto) {

    const revokedPermissions: Permission[] = [];

    for (const permissionId of data.permissions) {
      const rolePermission = await this.prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId, permissionId } },
        include: { permission: true },
      });

      if (!rolePermission) {
        throw new BadRequestException(
          `El permiso con ID ${permissionId} no está asignado al rol`
        );
      }

      if (!rolePermission.isActive) {
        throw new BadRequestException(
          `El permiso con ID ${permissionId} ya está revocado`
        );
      }

      await this.prisma.rolePermission.update({
        where: { roleId_permissionId: { roleId, permissionId } },
        data: { isActive: false },
      });

      revokedPermissions.push(rolePermission.permission);
    }

    return revokedPermissions;
  }

}
