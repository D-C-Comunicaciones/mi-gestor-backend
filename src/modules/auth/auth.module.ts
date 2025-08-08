import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { envs } from '@config/envs';
import { RedisModule } from '@infraestructure/redis/redis.module';
import { LoginAuditMiddleware } from '@common/middlewares/login-audit.middleware';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: envs.jwtSecret,
      signOptions: { 
        expiresIn: envs.expiresIn || '24h',
        issuer: envs.appName,
        audience: 'e-ducation-sessions',
      },
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    PrismaService,
    LoginAuditMiddleware,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoginAuditMiddleware).forRoutes('auth/login');
  }
}
