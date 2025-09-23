import { Injectable, UnauthorizedException, Inject, Scope, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/users.service';
import { envs } from '@config/envs';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { REDIS_CLIENT } from '@infraestructure/redis/client';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { LoginDto } from './dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  private logger = new Logger(AuthService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private http: HttpService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(REQUEST) private readonly request: Request,
  ) { }

  async validateUser(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Contraseña inválida');

    return user;
  }

  async login(data: LoginDto, req: Request, res: Response) {
    const user = await this.validateUser(data);
    const sessionId = uuidv4();

    req['user'] = {
      id: user.id,
      email: user.email,
      sessionId,
    };

    const ip =
      (req.headers['x-forwarded-for'] as string) ??
      req.socket.remoteAddress ??
      '0.0.0.0';
    const device = req.headers['user-agent'] ?? 'Unknown';

    try {
      const response = await firstValueFrom(this.http.get(envs.ipGeoLocation));
      const { city, region, country_name } = response.data;
      req['geo'] = `${city}, ${region}, ${country_name}`;
    } catch {
      req['geo'] = null;
    }

    const permissions =
      user.role?.rolePermissions
        .filter((rp) => rp.isActive)
        .map((rp) => rp.permission.name) || [];

    // ✅ Crear token con expiración explícita
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      jti: sessionId,
    }, {
      expiresIn: envs.expiresIn, // ✅ Usar configuración string
    });

    // ✅ Calcular tiempo de expiración en segundos para Redis
    const expiresInSeconds = this.parseExpirationToSeconds(envs.expiresIn);

    const sessionData = {
      user: { id: user.id, email: user.email },
      name: user.name,
      role: user.role?.name ?? null,
      permissions,
      token,
      jti: sessionId,
      expiresIn: expiresInSeconds,
      createdAt: new Date().toISOString(),
    };

    // ✅ Establece la cookie con el token
    res.cookie('access_token', token, {
      httpOnly: true, // Protección contra ataques XSS
      secure: envs.environment === 'production', // Solo envía la cookie en HTTPS en producción
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + this.parseExpirationToSeconds(envs.expiresIn) * 1000)
    });

    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      'EX',
      expiresInSeconds,
    );

    return {
      sessionId,
      access_token: {
        token,
        expiresIn: expiresInSeconds,
      },
      user: { id: user.id, email: user.email, name: user.name },
      role: sessionData.role,
      permissions: sessionData.permissions,
    };
  }

  // ✅ Método para convertir string de tiempo a segundos
  private parseExpirationToSeconds(expiration: string): number {
    const timeMap: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
    };

    const match = expiration.match(/^(\d+)([smhdw])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      return value * timeMap[unit];
    }

    // Si es un número puro, asumimos segundos
    const parsed = parseInt(expiration, 10);
    return isNaN(parsed) ? 86400 : parsed; // Default 24h
  }

  private extractToken(): string {
    const req = this.request;
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token no encontrado en cookie ni header');
    }

    return token;
  }

  async logout(jtiOrToken?: string): Promise<string> {
    this.logger.debug(`🔐 Logout llamado con: ${jtiOrToken ? jtiOrToken.substring(0, 20) + '...' : 'undefined'}`);
    
    jtiOrToken = jtiOrToken ?? this.extractToken();
    if (!jtiOrToken) {
      throw new UnauthorizedException('No se proporcionó token ni jti para cerrar sesión');
    }

    let jti: string;

    // ✅ Determinar si es un token JWT o un jti directo
    if (jtiOrToken.startsWith('eyJ')) {
      // Es un token JWT (comienza con 'eyJ' que es la codificación base64 del header JWT)
      try {
        const decoded: any = this.jwtService.decode(jtiOrToken);
        jti = decoded?.jti;

        this.logger.debug(`🔍 Token decodificado - JTI: ${jti}`);

        if (!jti) {
          throw new UnauthorizedException('Token JWT no contiene jti válido');
        }
      } catch (error) {
        this.logger.error(`❌ Error decodificando JWT: ${error.message}`);
        throw new UnauthorizedException('Token JWT inválido');
      }
    } else {
      // Es un jti directo (UUID)
      jti = jtiOrToken;
      this.logger.debug(`🔍 JTI directo recibido: ${jti}`);
    }

    // ✅ Verificar que la sesión existe en Redis y eliminarla
    const sessionKey = `session:${jti}`;
    this.logger.debug(`🔍 Buscando sesión en Redis con key: ${sessionKey}`);
    
    const sessionExists = await this.redis.exists(sessionKey);
    this.logger.debug(`🔍 Sesión existe en Redis: ${sessionExists ? 'Sí' : 'No'}`);

    if (!sessionExists) {
      // ✅ Lanzar error específico cuando no hay sesión activa
      this.logger.warn(`⚠️ Sesión ${jti} no encontrada en Redis - no hay sesión activa`);
      throw new UnauthorizedException('No se encontró una sesión activa para cerrar');
    } else {
      // ✅ Eliminar sesión de Redis
      const deletedCount = await this.redis.del(sessionKey);
      this.logger.log(`✅ Sesión ${jti} eliminada de Redis (count: ${deletedCount})`);
    }
    
    const message = 'Sesión cerrada correctamente';
    return message;
  }

  async getSessionFromRedis(jti: string) {
    const sessionData = await this.redis.get(`session:${jti}`);
    if (!sessionData) {
      throw new UnauthorizedException('Sesión no encontrada');
    }
    return JSON.parse(sessionData);
  }

}
