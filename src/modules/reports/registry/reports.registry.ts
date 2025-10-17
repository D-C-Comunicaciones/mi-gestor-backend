import { Injectable } from '@nestjs/common';
import { ReportHandler } from '../handlers/base-report.handler';
import { CollectionsReportHandler } from '../handlers/collections-report.handler';

@Injectable()
export class ReportRegistry {
  private readonly handlers = new Map<string, ReportHandler>();

  constructor(private readonly collectionsReport: CollectionsReportHandler) {
    this.register(collectionsReport);
  }

  private register(handler: ReportHandler) {
    this.handlers.set(handler.getName(), handler);
  }

  getHandler(name: string): ReportHandler | null {
    return this.handlers.get(name) ?? null;
  }

  getAvailableReports(): string[] {
    return Array.from(this.handlers.keys());
  }
}
