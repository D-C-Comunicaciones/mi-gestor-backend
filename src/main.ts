import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from '@config/envs';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { PrismaDecimalInterceptor, ResponseInterceptor } from '@common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  const allowedOrigins = envs.allowedOrigins.split(',');

  app.enableCors({
    origin: true, // acepta todos
    credentials: true,
  });

  app.setGlobalPrefix('v1');

  if (envs.environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Mi Gestor')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } if (envs.environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Mi Gestor')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const logger = new Logger(envs.appName);

  // Interceptor global para respuestas exitosas
  app.useGlobalInterceptors(
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
