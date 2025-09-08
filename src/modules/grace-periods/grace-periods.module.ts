import { Module } from '@nestjs/common';
import { GracePeriodsService } from './grace-periods.service';
import { GracePeriodsController } from './grace-periods.controller';

@Module({
  controllers: [GracePeriodsController],
  providers: [GracePeriodsService],
})
export class GracePeriodsModule {}
