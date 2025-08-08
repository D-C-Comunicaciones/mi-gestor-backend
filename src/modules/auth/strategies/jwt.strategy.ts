import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envs } from '@config/envs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: JwtStrategy.extractTokenFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
      passReqToCallback: true,
    });
    
    this.logger.log(`🔍 JWT Strategy initialized with secret: ${envs.jwtSecret?.substring(0, 10)}...`);
  }

  static extractTokenFromCookieOrHeader(req: Request): string | null {
    const logger = new Logger('JwtStrategy.extractToken');
    
    // 1. Cookie primero
    if (req.cookies?.access_token) {
      logger.log(`✅ Token encontrado en cookie: ${req.cookies.access_token.substring(0, 20)}...`);
      return req.cookies.access_token;
    }

    // 2. Header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      logger.log(`✅ Token encontrado en header: ${token.substring(0, 20)}...`);
      return token;
    }

    logger.warn(`❌ No se encontró token en cookie ni header`);
    return null;
  }

  async validate(req: Request, payload: any) {
    this.logger.log(`🔍 Validating payload: ${JSON.stringify(payload)}`);
    
    if (!payload?.sub || !payload?.email) {
      this.logger.error(`❌ Payload inválido - falta sub o email`);
      throw new UnauthorizedException('Token inválido - campos requeridos faltantes');
    }

    const user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      jti: payload.jti,
    };
    
    this.logger.log(`✅ Usuario validado: ${JSON.stringify(user)}`);
    return user;
  }
}
