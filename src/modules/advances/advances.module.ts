import { Module } from '@nestjs/common';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { ChangesModule } from '@modules/changes/changes.module';
import { AdvancesService } from './advances.service';
import { AdvancesController } from './advances.controller';

@Module({
  imports: [
    PrismaModule,
    ChangesModule,
  ],
  controllers: [AdvancesController],
  providers: [AdvancesService],
  exports: [AdvancesService],
})
export class AdvancesModule {}
