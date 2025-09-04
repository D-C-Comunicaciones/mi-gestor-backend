import { Module } from '@nestjs/common';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { ChangesModule } from '@modules/changes/changes.module';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [
    PrismaModule,
    ChangesModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
