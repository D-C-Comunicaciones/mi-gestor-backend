import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CollectorPaginationDto, CreateCollectorDto, ResponseCollectorDto, UpdateCollectorDto } from './dto';
import { CollectorListResponse, CollectorResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { SwaggerCreateCollectorDocs, SwaggerFindAllCollectorsDocs, SwaggerFindOneCollectorDocs, SwaggerFindUnassignedCollectorsDocs, SwaggerUpdateCollectorDocs } from '@common/decorators/swagger/collectors';

@ApiTags('Collectors')
@ApiBearerAuth()
@ApiExtraModels(ResponseCollectorDto)
@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) { }

  @Get()
  @Permissions('view.collectors')
  @SwaggerFindAllCollectorsDocs()
  async findAll(
    @Query() collectorPaginationDto: CollectorPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

    if (collectorsArray.length === 0) {
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

  @Get('unassigned')
  @Permissions('view.collectors')
  @SwaggerFindUnassignedCollectorsDocs()
  async findUnassigned(
    @Query() collectorPaginationDto: CollectorPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findUnassigned(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

    if (collectorsArray.length === 0) {
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

  @Post()
  @Permissions('create.collectors')
  @SwaggerCreateCollectorDocs()
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

  @Get(':id')
  @Permissions('view.collectors')
  @SwaggerFindOneCollectorDocs()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.findOne(id);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador obtenido correctamente',
      collector,
    };
  }

  @Patch(':id')
  @SwaggerUpdateCollectorDocs()
  @Permissions('update.collectors')
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
