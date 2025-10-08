import { Body, Controller, Post, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { ResponseCollectionDto, ResponseCollectionListDto } from './dto';
import { CollectionResponse, CollectionListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto';
import { SwaggerCreateCollection, SwaggerGetCollections } from '@common/decorators';

@ApiTags('collections')
@ApiBearerAuth()
@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) { }

  @Post()
  @Permissions('create.collections')
  @SwaggerCreateCollection()
  async create(@Body() dto: CreateCollectionDto, @Req() req): Promise<CollectionResponse> {
    const rawCollection = await this.collectionsService.create(dto, req);
    const collection = plainToInstance(ResponseCollectionDto, rawCollection, { excludeExtraneousValues: true });
    return {
      customMessage: 'Cobro registrado exitosamente',
      collection
    }
  }

  @Get()
  @Permissions('view.collections')
  @SwaggerGetCollections()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectionListResponse> {
    const { collections, meta } = await this.collectionsService.findAll(paginationDto);

    if (collections.length === 0) {
      return {
        customMessage: 'No existen registros',
        collections: [],
        meta,
      };
    }

    const collectionsResponse = plainToInstance(ResponseCollectionListDto, collections, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Historial de cobros obtenido correctamente',
      collections: collectionsResponse,
      meta,
    };
  }
}
