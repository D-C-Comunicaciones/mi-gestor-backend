// docs.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('import-customers')
  async downloadTemplate(@Res() res: Response) {
    const { stream } = this.templatesService.getCustomerTemplateFile();

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="import_customers_template.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    stream.pipe(res);
  }
}
