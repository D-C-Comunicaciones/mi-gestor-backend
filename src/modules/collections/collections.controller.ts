import { Body, Controller, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    return await this.collectionsService.create(createCollectionDto);
  }

}
