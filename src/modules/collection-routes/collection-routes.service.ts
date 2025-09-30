import { Injectable } from '@nestjs/common';
import { CreateCollectionRouteDto } from './dto/create-collection-route.dto';
import { UpdateCollectionRouteDto } from './dto/update-collection-route.dto';

@Injectable()
export class CollectionRoutesService {
  create(createCollectionRouteDto: CreateCollectionRouteDto) {
    return 'This action adds a new collectionRoute';
  }

  findAll() {
    return `This action returns all collectionRoutes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} collectionRoute`;
  }

  update(id: number, updateCollectionRouteDto: UpdateCollectionRouteDto) {
    return `This action updates a #${id} collectionRoute`;
  }

  remove(id: number) {
    return `This action removes a #${id} collectionRoute`;
  }
}
