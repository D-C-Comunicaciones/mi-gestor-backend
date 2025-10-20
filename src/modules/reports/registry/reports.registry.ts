import { Injectable } from '@nestjs/common';
import { ReportHandler } from '../handlers/base-report.handler';
import { LoanReportHandler } from '../handlers/loan-report.handler';
import { CollectionReportHandler } from '../handlers/collection-report.handler';
import { MoratoryInterestReportHandler } from '../handlers/moratory-interest-report.handler';

@Injectable()
export class ReportRegistry {
  private readonly handlers = new Map<string, ReportHandler>();

  constructor(
    private readonly collectionReport: CollectionReportHandler,
    private readonly loanReport: LoanReportHandler,
    private readonly moratoryInterestReport: MoratoryInterestReportHandler,
  ) {
    this.register(collectionReport);
    this.register(loanReport);
    this.register(moratoryInterestReport);
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
