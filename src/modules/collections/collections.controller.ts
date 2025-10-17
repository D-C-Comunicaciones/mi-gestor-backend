import { Body, Controller, Post, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { ResponseCollectionDto, ResponseCollectionListDto } from './dto';
import { CollectionResponse, CollectionListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto';
import { SwaggerCreateCollection, SwaggerGetCollections } from '@common/decorators/swagger';
import { HistoryCollectionQueryDto } from './dto';

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

  @Get('history')
  @Permissions('view.collections')
  @ApiOperation({ summary: 'Obtener historial de recaudos por cliente o préstamo' })
  @ApiResponse({ status: 200, description: 'Historial de recaudos obtenido correctamente.' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos.' })
  async getHistory(@Query() query: HistoryCollectionQueryDto) {
    const history = await this.collectionsService.findAllByCustomerOrLoan(query);
    if (history.length === 0) {
      return {
        customMessage: 'No se encontraron recaudos para los criterios especificados.',
        data: [],
      };
    }
    return {
      customMessage: 'Historial de recaudos obtenido correctamente.',
      data: history,
    };
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
