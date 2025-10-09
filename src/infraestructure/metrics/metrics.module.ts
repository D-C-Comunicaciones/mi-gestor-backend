import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricService],
  exports: [MetricService],
})
export class MetricModule {}
