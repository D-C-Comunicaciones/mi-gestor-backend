import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    
    const headerToken = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;
    
    this.logger.log(`🔍 Debug - Header token: ${headerToken}`);
    this.logger.log(`🔍 Debug - Cookie token: ${cookieToken}`);
    
    try {
      const result = await super.canActivate(context);
      this.logger.log(`✅ Passport validation successful: ${result}`);
      this.logger.log(`✅ User from Passport: ${JSON.stringify(req.user)}`);
      return result as boolean;
    } catch (error) {
      this.logger.error(`❌ Passport validation failed: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.log(`🔍 HandleRequest - err: ${err?.message}`);
    this.logger.log(`🔍 HandleRequest - user: ${JSON.stringify(user)}`);
    this.logger.log(`🔍 HandleRequest - info: ${JSON.stringify(info)}`);
    
    if (err) {
      throw err;
    }
    
    if (!user) {
      if (info?.message) {
        switch (info.message) {
          case 'jwt expired':
            throw new UnauthorizedException('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          case 'invalid token':
          case 'jwt malformed':
          case 'invalid signature':
            throw new UnauthorizedException('Token de autenticación inválido. Por favor, inicie sesión nuevamente.');
          default:
            throw new UnauthorizedException('Error de autenticación. Por favor, inicie sesión nuevamente.');
        }
      } else {
        throw new UnauthorizedException('Acceso no autorizado. Se requiere token de autenticación válido.');
      }
    }
    
    return user;
  }
}
