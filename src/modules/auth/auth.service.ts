import { Injectable, UnauthorizedException, Inject, Scope, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/users.service';
import { envs } from '@config/envs';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { REDIS_CLIENT } from '@infraestructure/redis/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
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

  async login(data: LoginDto, req: Request) {
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
    if (!jtiOrToken) {
      throw new UnauthorizedException('No se proporcionó token ni jti para cerrar sesión');
    }

    let jti: string;
    let ttl = 3600; // TTL por defecto

    // ✅ Determinar si es un token JWT o un jti directo
    if (jtiOrToken.startsWith('eyJ')) {
      // Es un token JWT (comienza con 'eyJ' que es la codificación base64 del header JWT)
      try {
        const decoded: any = this.jwtService.decode(jtiOrToken);
        jti = decoded?.jti;
        const exp = decoded?.exp;
        ttl = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : ttl;

        if (!jti) {
          throw new UnauthorizedException('Token JWT no contiene jti válido');
        }
      } catch (error) {
        throw new UnauthorizedException('Token JWT inválido');
      }
    } else {
      // Es un jti directo (UUID)
      jti = jtiOrToken;
    }

    // ✅ Verificar que la sesión existe en Redis
    const sessionKey = `session:${jti}`;
    const sessionExists = await this.redis.exists(sessionKey);

    if (!sessionExists) {
      // ✅ No lanzar error si la sesión ya no existe, simplemente informar
      this.logger.warn(`Sesión ${jti} no encontrada en Redis - posiblemente ya expirada`);
    } else {
      // ✅ Eliminar sesión de Redis
      await this.redis.del(sessionKey);
      this.logger.log(`✅ Sesión ${jti} eliminada de Redis`);
    }

    // ✅ Agregar jti a blacklist para invalidar el token
    await this.redis.set(`bl:${jti}`, 'revoked', 'EX', ttl);
    this.logger.log(`✅ Token ${jti} agregado a blacklist por ${ttl} segundos`);
    
    const message =  'Sesión cerrada correctamente';

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
