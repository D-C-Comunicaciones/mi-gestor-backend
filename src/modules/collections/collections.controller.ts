import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { ResponseCollectionDto } from './dto';
import { CollectionResponse } from './interfaces';

@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) { }

  @Post()
  @Permissions('create.collections')
  async create(@Body() dto: CreateCollectionDto, @Req() req): Promise<CollectionResponse> {
    const rawCollection = await this.collectionsService.create(dto, req);
    const collection = plainToInstance(ResponseCollectionDto, rawCollection, { excludeExtraneousValues: true });
    return {
      customMessage: 'Cobro registrado exitosamente',
      collection
    }
  }
}
