import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import {
  CollectorPaginationDto,
  CreateCollectorDto,
  ResponseCollectorDto,
  UpdateCollectorDto,
} from './dto';
import {
  CollectorListResponse,
  CollectorResponse,
} from './interfaces/collector-response.interface';
import { plainToInstance } from 'class-transformer';

@Controller('collectors')
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) { }

  @Get()
  async findAll(
    @Query() collectorPaginationDto: CollectorPaginationDto,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

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
