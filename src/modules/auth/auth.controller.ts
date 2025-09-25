import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  HttpCode,
  Logger,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto';
import { envs } from '@config/envs';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiBody, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService) { }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario con email y contraseña, retorna tokens de acceso'
  })
  @ApiBody({
    description: 'Credenciales de login',
    examples: {
      'admin-login': {
        summary: 'Login de administrador',
        description: 'Ejemplo de login con cuenta de administrador',
        value: {
          email: 'admin@migestor.com',
          password: 'admin123456'
        }
      },
      'user-login': {
        summary: 'Login de usuario',
        description: 'Ejemplo de login con cuenta de usuario regular',
        value: {
          email: 'usuario@ejemplo.com',
          password: 'password123'
        }
      }
    },
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'usuario@ejemplo.com',
          description: 'Email del usuario'
        },
        password: {
          type: 'string',
          minLength: 6,
          example: 'password123',
          description: 'Contraseña del usuario'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Token JWT de acceso'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@ejemplo.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            role: { type: 'string', example: 'user' }
          }
        },
        expiresIn: {
          type: 'number',
          example: 3600,
          description: 'Tiempo de expiración del token en segundos'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Credenciales inválidas o datos faltantes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email debe ser un email válido', 'password es requerido']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales incorrectas',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Email o contraseña incorrectos' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno del servidor durante el login' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('token')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna la información del perfil del usuario actualmente autenticado'
  })
  @ApiOkResponse({
    description: 'Perfil del usuario obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'usuario@ejemplo.com' },
        name: { type: 'string', example: 'Juan Pérez' },
        phone: { type: 'string', example: '+57 300 123 4567' },
        role: { type: 'string', example: 'user' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-20T14:45:00.000Z' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token de acceso faltante, inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Usuario inactivo o sin permisos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Usuario inactivo o sin permisos' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno del servidor al obtener el perfil' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async getProfile(@Req() req: Request) {
    return {
      customMessage: 'Perfil obtenido exitosamente',
      user: req.user,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cerrar sesión del usuario',
    description: 'Invalida el token JWT y la sesión del usuario. Acepta token desde Authorization header o cookie.'
  })
  @ApiOkResponse({
    description: 'Sesión cerrada exitosamente',
    examples: {
      'success': {
        summary: 'Sesión cerrada exitosamente',
        value: {
          customMessage: 'Sesión cerrada correctamente'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'No se encontró token para cerrar sesión',
    examples: {
      'no-token': {
        summary: 'No se encontró token',
        value: {
          statusCode: 400,
          message: 'No se encontró token en cookie ni en Authorization header',
          error: 'Bad Request'
        }
      },
      'no-active-session': {
        summary: 'No hay sesión activa',
        value: {
          statusCode: 400,
          message: 'No se encontró una sesión activa para cerrar',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token de acceso no válido o faltante.',
    examples: {
      'invalid-token': {
        summary: 'Token inválido',
        value: {
          statusCode: 401,
          message: 'Token no válido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor.',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor durante el logout',
          error: 'Internal Server Error'
        }
      }
    }
  })
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