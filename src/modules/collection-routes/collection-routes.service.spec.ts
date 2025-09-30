import { Test, TestingModule } from '@nestjs/testing';
import { CollectionRoutesService } from './collection-routes.service';

describe('CollectionRoutesService', () => {
  let service: CollectionRoutesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionRoutesService],
    }).compile();

    service = module.get<CollectionRoutesService>(CollectionRoutesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
