import { Module } from '@nestjs/common';
import { TypeDiscountsService } from './type-discounts.service';
import { TypeDiscountsController } from './type-discounts.controller';

@Module({
  controllers: [TypeDiscountsController],
  providers: [TypeDiscountsService],
})
export class TypeDiscountsModule {}
