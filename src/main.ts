import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from '@config/envs';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { PrismaDecimalInterceptor, ResponseInterceptor, MetricsHttpInterceptor } from '@common/interceptors';
import * as express from 'express';
import { join } from 'path';
import { apiReference } from '@scalar/nestjs-api-reference';
import { MetricService } from '@infraestructure/metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir carpeta public
  app.use('/public', express.static(join(process.cwd(), 'public')));

  app.use(cookieParser());

  const allowedOrigins = envs.allowedOrigins.split(',');

  app.enableCors({
    origin: true, // acepta todos
    credentials: true,
  });

  app.setGlobalPrefix('v1');

  if (envs.environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mi Gestor API documentation')
      .setDescription('Documentación de la API para la app miGestor')
      .setVersion('1.0')
      .addTag('módulos', 'Módulos principales de la aplicación') 
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .addCookieAuth('token') // cookie con nombre "token"
      .build();

    const apiDocumentation = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('v1/docs', app, apiDocumentation);

    app.use(
      '/documentation',
      apiReference({
        content: apiDocumentation,
        options: {
          title: 'API Reference - Mi Gestor',
          explorer: true,
        },
      })
    );
  }

  // Servir TODO lo que esté en /public
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/', // Acceso: http://localhost:3000/logos/... o /documents/...
  });

  const logger = new Logger(envs.appName);

  // Interceptor global para respuestas exitosas
  app.useGlobalInterceptors(
    new MetricsHttpInterceptor(app.get(MetricService)),
    new PrismaDecimalInterceptor(),
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

  await app.listen(envs.port, () => {
    logger.log(`🚀 ${envs.appName} is running in ${envs.environment} mode`);
    logger.log(`version: ${envs.appVersion}`);
    logger.log(`description: ${envs.appDescription}`);
  });

}

bootstrap();