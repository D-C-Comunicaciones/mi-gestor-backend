import { Test, TestingModule } from '@nestjs/testing';
import { CollectionRoutesController } from './collection-routes.controller';
import { CollectionRoutesService } from './collection-routes.service';

describe('CollectionRoutesController', () => {
  let controller: CollectionRoutesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionRoutesController],
      providers: [CollectionRoutesService],
    }).compile();

    controller = module.get<CollectionRoutesController>(CollectionRoutesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
