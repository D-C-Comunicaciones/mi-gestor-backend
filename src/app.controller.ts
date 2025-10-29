import { Controller, Get, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { SwaggerAppDocs, SwaggerGetServerStatus, SwaggerSimulateErrorDocs } from '@common/decorators/swagger';
import { ApiTags } from '@nestjs/swagger';


@Controller()
@ApiTags('App')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SwaggerAppDocs()
  getHello(@Res() res: Response) {
    const html = this.appService.getHelloHtml(); // el service devuelve el HTML
    res.type('html').send(html); // el controller solo lo envía al cliente
  }

  @Get('simulate-error')
  @SwaggerSimulateErrorDocs()
  simulateError() {
    throw new HttpException('Error simulado para testing', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // 🔹 Endpoint de salud /v1/check
  @Get('check')
  @SwaggerGetServerStatus()
  check() {
    const serverHealth = this.appService.getServerHealth();
    return { 
      customMessage: 'Servidor funcionando correctamente',
      serverHealth 
    };
  }
}
