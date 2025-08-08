import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { envs } from '@config/envs';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService) { }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionId, access_token, user, role, permissions } =
      await this.authService.login(loginDto, req);

    // Setear cookie httpOnly
    res.cookie('access_token', access_token.token ?? access_token, {
      httpOnly: true,
      secure: envs.environment === 'production',
      sameSite: 'lax',
      maxAge: 1000 * (typeof access_token.expiresIn === 'number' ? access_token.expiresIn : 86400),
      path: '/',
    });

    return {
      customMessage: 'Usuario autenticado correctamente',
      sessionId,
      // access_token: access_token.token ?? access_token, // También en el body para Bearer token
      user,
      role,
      permissions,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const jti = req.user?.jti;

      if (!jti) {
        this.logger.warn('⚠️ No se encontró jti en req.user para logout');
        res.clearCookie('access_token', { path: '/' });

        return {
          customMessage: 'No se encontró una sesión activa para cerrar',
        };
      }

      const message = await this.authService.logout(jti);

      // Limpiar cookie
      res.clearCookie('access_token', { path: '/' });

      return {
        customMessage: message, // ← usa el mensaje retornado por el servicio
      };
    } catch (error) {
      this.logger.error(`❌ Error durante logout: ${error.message}`);

      // Limpiar cookie aunque falle
      res.clearCookie('access_token', { path: '/' });

      return {
        customMessage: 'Sesión cerrada correctamente (aunque ya estaba expirada)',
        warning: 'La sesión pudo haber expirado previamente o no existir',
      };
    }
  }

  @Get('me/session')
  @UseGuards(JwtAuthGuard)
  async getSession(@Req() req: Request) {
    const session = await this.authService.getSessionFromRedis(req.user.jti);

    return {
      customMessage: 'Sesión obtenida correctamente',
      sessionId: session.jti,
      access_token: session.token,
      user: session.user,
      role: session.role,
      permissions: session.permissions,
    };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  verify(@Req() req: Request) {
    return {
      valid: true,
      user: req.user,
      message: 'Token válido y sesión activa'
    };
  }

  @Get('test')
  @UseGuards(JwtAuthGuard)
  test(@Req() req: Request) {
    return { message: 'Token válido', user: req.user };
  }
}
