import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, PermissionPaginationDto, ResponsePermissionDto } from './dto';
import { StatusDto } from '@common/dto';
import { JwtAuthGuard, PermissionsGuard } from '@auth/guards';
import { Permissions } from '@auth/decorators';
import { plainToInstance } from 'class-transformer';
import { PermissionListResponse, PermissionResponse } from './interfaces';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Post()
  @Permissions('create permissions')
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponse> {
    const raw = await this.permissionsService.create(dto);
    const permission = plainToInstance(ResponsePermissionDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Permiso creado correctamente',
      permission,
    };
  }

  @Get()
  @Permissions('list permissions')
  async findAll(@Query() query: PermissionPaginationDto): Promise<PermissionListResponse> {
    const { rawPermissions, meta } = await this.permissionsService.findAll(query);
    const permissionsArray = Array.isArray(rawPermissions) ? rawPermissions : [rawPermissions];
    const permissions = plainToInstance(ResponsePermissionDto, permissionsArray, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Permisos obtenidos correctamente',
      permissions,
      meta,
    };
  }

  @Get(':id')
  @Permissions('view permission')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PermissionResponse> {
    const raw = await this.permissionsService.findOne(id);
    const permission = plainToInstance(ResponsePermissionDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Permiso obtenido correctamente',
      permission,
    };
  }

  @Patch(':id')
  @Permissions('update permissions')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponse> {
    const raw = await this.permissionsService.update(id, dto);
    const permission = plainToInstance(ResponsePermissionDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: 'Permiso actualizado correctamente',
      permission,
    };
  }

  @Patch(':id/change-status')
  @Permissions('change permissions status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() status: StatusDto,
  ): Promise<PermissionResponse> {
    const raw = await this.permissionsService.changeStatus(id, status);
    const permission = plainToInstance(ResponsePermissionDto, raw, {
      excludeExtraneousValues: true,
    });
    return {
      customMessage: `Permiso ${status.status ? 'activado' : 'desactivado'} correctamente`,
      permission,
    };
  }
}
