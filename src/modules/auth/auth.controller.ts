import { Controller, Post, Body, Req, Res, Get, HttpCode, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto';
import { envs } from '@config/envs';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerGetProfileDoc, SwaggerLoginDoc, SwaggerLogoutDoc } from '@common/decorators/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService) { }

  @Post('login')
  @HttpCode(200)
  @SwaggerLoginDoc()
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionId, access_token, user, role, permissions } =
      await this.authService.login(loginDto, req, res);

    return {
      customMessage: 'Usuario autenticado correctamente',
      sessionId,
      access_token,
      user,
      role,
      permissions,
    };
  }

  @Get('profile')
  @SwaggerGetProfileDoc()
  async getProfile(@Req() req: Request) {
    return {
      customMessage: 'Perfil obtenido exitosamente',
      user: req.user,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @SwaggerLogoutDoc()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('authorization') authHeader?: string,
  ) {
    try {
      // 1. Intentar obtener el token del encabezado 'Authorization'
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      // 2. Intentar obtener el token de la cookie 'access_token'
      const cookieToken = req.cookies?.access_token;

      this.logger.debug(`🔍 Bearer token: ${bearerToken ? 'Present' : 'Not found'}`);
      this.logger.debug(`🔍 Cookie token: ${cookieToken ? 'Present' : 'Not found'}`);

      // 3. Elegir el token a invalidar (priorizar Bearer sobre cookie)
      const tokenToInvalidate = bearerToken || cookieToken;

      // 4. Si no se encontró ningún token, retornar error
      if (!tokenToInvalidate) {
        this.logger.warn('❌ No se encontró token en Authorization header ni en cookie');
        // Aún así, limpiar la cookie por si acaso
        res.clearCookie('access_token', {
          path: '/',
          httpOnly: true,
          secure: envs.environment === 'production',
          sameSite: 'strict'
        });
        throw new UnauthorizedException('No se encontró token en cookie ni en Authorization header');
      }

      this.logger.log(`🔐 Intentando logout con token: ${tokenToInvalidate.substring(0, 20)}...`);

      // 5. Llamar al servicio para invalidar el token/sesión en Redis
      // El servicio ya valida si existe la sesión y lanza error si no existe
      const serviceMessage = await this.authService.logout(tokenToInvalidate);

      // 6. Limpiar la cookie del cliente
      res.clearCookie('access_token', {
        path: '/',
        httpOnly: true,
        secure: envs.environment === 'production',
        sameSite: 'strict'
      });

      this.logger.log('✅ Logout exitoso - Cookie eliminada');

      // 7. Retornar una respuesta exitosa
      return { customMessage: serviceMessage };

    } catch (error) {
      // Manejar errores y aún así limpiar la cookie
      this.logger.error(`❌ Error durante logout: ${error.message}`);

      // Limpiar la cookie independientemente del error
      res.clearCookie('access_token', {
        path: '/',
        httpOnly: true,
        secure: envs.environment === 'production',
        sameSite: 'strict'
      });

      // Si es UnauthorizedException, re-lanzarla
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Para otros errores, lanzar UnauthorizedException genérica
      throw new UnauthorizedException('Error durante el cierre de sesión');
    }
  }
}