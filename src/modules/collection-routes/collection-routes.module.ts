import { Module } from '@nestjs/common';
import { CollectionRoutesService } from './collection-routes.service';
import { CollectionRoutesController } from './collection-routes.controller';

@Module({
  controllers: [CollectionRoutesController],
  providers: [CollectionRoutesService],
})
export class CollectionRoutesModule {}
