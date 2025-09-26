import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response) {
    const html = this.appService.getHelloHtml(); // el service devuelve el HTML
    res.type('html').send(html); // el controller solo lo envía al cliente
  }
}
