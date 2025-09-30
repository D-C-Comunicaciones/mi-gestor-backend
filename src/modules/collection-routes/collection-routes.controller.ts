import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CollectionRoutesService } from './collection-routes.service';
import { CreateCollectionRouteDto } from './dto/create-collection-route.dto';
import { UpdateCollectionRouteDto } from './dto/update-collection-route.dto';

@Controller('collection-routes')
export class CollectionRoutesController {
  constructor(private readonly collectionRoutesService: CollectionRoutesService) {}

  @Post()
  create(@Body() createCollectionRouteDto: CreateCollectionRouteDto) {
    return this.collectionRoutesService.create(createCollectionRouteDto);
  }

  @Get()
  findAll() {
    return this.collectionRoutesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionRoutesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollectionRouteDto: UpdateCollectionRouteDto) {
    return this.collectionRoutesService.update(+id, updateCollectionRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionRoutesService.remove(+id);
  }
}
