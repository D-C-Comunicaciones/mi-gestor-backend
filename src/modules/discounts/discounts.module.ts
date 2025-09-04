import { Module } from '@nestjs/common';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { ChangesModule } from '@modules/changes/changes.module';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';

@Module({
  imports: [
    PrismaModule,
    ChangesModule,
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
