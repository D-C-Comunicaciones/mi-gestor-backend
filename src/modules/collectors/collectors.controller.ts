import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CollectorPaginationDto, CreateCollectorDto, ResponseCollectorDto, UpdateCollectorDto } from './dto';
import { CollectorListResponse, CollectorResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiUnprocessableEntityResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse, ApiParam, ApiQuery, ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiTags('Collectors')
@ApiBearerAuth()
@ApiExtraModels(ResponseCollectorDto)
@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) { }

  @Get()
  @Permissions('view.collectors')
  @ApiOperation({ summary: 'Listar cobradores', description: 'Retorna lista paginada de cobradores.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
  @ApiOkResponse({
    description: 'Listado obtenido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cobradores obtenidos correctamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            collectors: { type: 'array', items: { $ref: getSchemaPath(ResponseCollectorDto) } },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                page: { type: 'number', example: 1 },
                lastPage: { type: 'number', example: 3 },
                limit: { type: 'number', example: 10 },
                hasNextPage: { type: 'boolean', example: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'No existen registros', schema: { example: { message: 'No existen registros', code: 404, status: 'error' } } })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Sin permiso view.collectors' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAll(
    @Query() collectorPaginationDto: CollectorPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

    if (collectorsArray.length === 0) {
      res.status(404);
      return {
        customMessage: 'No existen registros',
        collectors: [],
        meta,
      };
    }

    const collectors = plainToInstance(ResponseCollectorDto, collectorsArray, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobradores obtenidos correctamente',
      collectors,
      meta,
    };

  }

  @Get(':id')
  @Permissions('view.collectors')
  @ApiOperation({ summary: 'Obtener cobrador', description: 'Retorna un cobrador por id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Cobrador encontrado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cobrador obtenido correctamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            collector: { $ref: getSchemaPath(ResponseCollectorDto) }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Cobrador no encontrado', schema: { example: { message: 'Cobrador no encontrado', code: 404, status: 'error' } } })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Sin permiso view.collectors' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.findOne(id);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador obtenido correctamente',
      collector,
    };

  }

  @Post()
  @Permissions('create.collectors')
  @ApiOperation({ summary: 'Crear cobrador', description: 'Crea un nuevo cobrador y su usuario asociado.' })
  @ApiBody({ type: CreateCollectorDto })
  @ApiCreatedResponse({
    description: 'Cobrador creado',
    schema: {
      example: {
        message: 'Cobrador creado correctamente',
        code: 201,
        status: 'success',
        data: { collector: { id: 1, firstName: 'Juan', lastName: 'Pérez', documentNumber: 123, birthDate: '2000-01-01', createdAt: '2024-01-01 10:00:00' } }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Violación de unicidad o datos inválidos', schema: { example: { message: 'El número de documento ya está registrado.', code: 400, status: 'error' } } })
  @ApiUnprocessableEntityResponse({ description: 'Error de validación', schema: { example: { message: 'Los datos enviados no son válidos.', code: 422, status: 'error', errors: ['firstName should not be empty'] } } })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Sin permiso create.collectors' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @Body() data: CreateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.create(data);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador creado correctamente',
      collector,
    };

  }

  @Patch(':id')
  @Permissions('update.collectors')
  @ApiOperation({ summary: 'Actualizar cobrador', description: 'Actualiza campos del cobrador (solo cambios detectados).' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateCollectorDto })
  @ApiOkResponse({ description: 'Actualizado', schema: { example: { message: 'Cobrador actualizado correctamente', code: 200, status: 'success', data: { collector: { id: 1 } } } } })
  @ApiBadRequestResponse({ description: 'Sin cambios o unicidad', schema: { example: { message: 'No se detectaron cambios.', code: 400, status: 'error' } } })
  @ApiNotFoundResponse({ description: 'No existe', schema: { example: { message: 'Cobrador no encontrado', code: 404, status: 'error' } } })
  @ApiUnprocessableEntityResponse({ description: 'Validación fallida' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Sin permiso update.collectors' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.update(id, dto);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador actualizado correctamente',
      collector,
    };
  }

}
