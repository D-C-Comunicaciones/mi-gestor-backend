import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignRevokePermissionDto, RolePaginationDto } from './dto';
import { StatusDto } from '@common/dto';
import { PermissionsGuard, JwtAuthGuard } from '@auth/guards';
import { Permissions } from '@auth/decorators';
import { AssignedOrRevokedPermissionsResponse, RoleResponse, RolesListResponse, UpdatedRoleResponse } from './interfaces/';
import { plainToInstance } from 'class-transformer';
import { ResponseRoleDto } from './dto/response-role.dto';
import { ResponsePermissionDto } from '@permissions/dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @Permissions('create roles')
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    const raw = await this.rolesService.create(dto);
    const role = plainToInstance(ResponseRoleDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Rol creado correctamente',
      role,
    };
  }

  @Get()
  @Permissions('list roles')
  async findAll(@Query() rolePaginationDto: RolePaginationDto): Promise<RolesListResponse> {
    const { rawRoles, meta } = await this.rolesService.findAll(rolePaginationDto);

    // Garantiza que siempre sea un arreglo
    const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    // Transforma correctamente a un arreglo de DTOs
    const roles = plainToInstance(ResponseRoleDto, rolesArray, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Roles obtenidos correctamente',
      roles,
      meta,
    };
  }


  @Get(':id')
  @Permissions('view role')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponse> {
    const raw = await this.rolesService.findOne(id);
    const role = plainToInstance(ResponseRoleDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Rol obtenido correctamente',
      role,
    };
  }

  @Patch(':id')
  @Permissions('update roles')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<UpdatedRoleResponse> {
    const raw = await this.rolesService.update(id, dto);
    const role = plainToInstance(ResponseRoleDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Rol actualizado correctamente',
      role,
    };
  }

  @Patch(':id/change-status')
  @Permissions('change roles status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() status: StatusDto,
  ): Promise<UpdatedRoleResponse> {
    const raw = await this.rolesService.changeStatus(id, status);
    const role = plainToInstance(ResponseRoleDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: `Rol ${status.status ? 'activado' : 'desactivado'} correctamente`,
      role,
    };
  }

  @Patch(':id/assign-permissions')
  @Permissions('assign permissions to roles')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRevokePermissionDto,
  ): Promise<AssignedOrRevokedPermissionsResponse> {
    const { rawPermissions } = await this.rolesService.assignPermissions(id, dto);

    // Garantiza que siempre sea un arreglo
    const permissionsArray = Array.isArray(rawPermissions) ? rawPermissions : [rawPermissions];

    // Transforma correctamente a un arreglo de DTOs
    const assignedPermissions = plainToInstance(ResponsePermissionDto, permissionsArray, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Permisos asignados correctamente',
      assignedPermissions,
    };
  }


  @Patch(':id/revoke-permissions')
  @Permissions('revoke permissions from roles')
  async revokePermissions(
    @Param('id', ParseIntPipe) roleId: number,
    @Body() dto: AssignRevokePermissionDto,
  ): Promise<AssignedOrRevokedPermissionsResponse> {
    const rawPermissions = await this.rolesService.revokePermissions(roleId, dto);
    const revokedPermissions = plainToInstance(ResponsePermissionDto, rawPermissions, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Permisos revocados correctamente',
      revokedPermissions,
    };
  }
  
}
