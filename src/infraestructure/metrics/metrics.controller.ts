import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricService } from './metrics.service';

@Controller('metrics')
export class MetricController {
  constructor(private readonly metricsService: MetricService) { }

  @Get()
  async getMetrics(@Res() res: Response) {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  }

  @Get('metrics-debug')
  async metricsDebug() {
    const metricService = this.metricsService;
    const registry = metricService.getRegistry();

    const metrics = registry.getMetricsAsArray().map(m => ({
      name: m.name,
      type: m.type,
      help: m.help
    }));

    return {
      metricsInRegistry: metrics,
      total: metrics.length,
      hasMigestorMetrics: metrics.some(m => m.name.includes('migestor_'))
    };
  }
}
