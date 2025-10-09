import { Module } from '@nestjs/common';
import { MetricController } from './metrics.controller';
import { MetricService } from './metrics.service';

@Module({
  controllers: [MetricController],
  providers: [MetricService],
  exports: [MetricService],
})
export class MetricModule {}
