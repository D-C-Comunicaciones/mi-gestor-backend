import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from '@config/envs';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { DecimalInterceptor, ResponseInterceptor } from '@common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser()); 

  app.enableCors({
    origin: [envs.frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('v1');
  
  // Configuración de Swagger
  if (envs.environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Mi Gestor')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } // Ruta: /api/docs

  const logger = new Logger(envs.appName);

  // Interceptor global para respuestas exitosas
  app.useGlobalInterceptors(
    new DecimalInterceptor(),
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  
  // Filtro global para errores
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setViewEngine('hbs');
  
  if (envs.environment === 'production') {
    // En producción siempre apunta a dist/views porque copiaste las vistas allí
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
  } else {
    // En desarrollo usa src/views
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
  }

  await app.listen(envs.port, () => {
    logger.log(`🚀 ${envs.appName} is running in ${envs.environment} mode`);
    logger.log(`version: ${envs.appVersion}`);
    logger.log(`description: ${envs.appDescription}`);
  });

}

bootstrap();