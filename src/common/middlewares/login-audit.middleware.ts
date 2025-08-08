import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'infraestructure/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { envs } from '@config/envs';

@Injectable()
export class LoginAuditMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('[Middleware] Interceptando solicitud:', req.method, req.originalUrl);

    if (req.originalUrl.includes('auth/login') && req.method === 'POST') {
      console.log('[Middleware] Ruta de login detectada, esperando respuesta...');

      res.on('finish', async () => {
        console.log('[Middleware] Respuesta finalizada con código:', res.statusCode);

        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            // Esperar a que `req.user` esté definido (máximo 10 intentos x 20ms = 200ms)
            let attempts = 0;
            while (
              (!req['user'] || !req['user'].id || !req['user'].sessionId) &&
              attempts < 10
            ) {
              await new Promise(resolve => setTimeout(resolve, 20));
              attempts++;
            }

            const user = req['user'];
            if (!user?.id || !user?.sessionId) {
              console.warn('[Middleware] Usuario o sessionId no disponible tras esperar');
              return;
            }

            const ip =
              (req.headers['x-forwarded-for'] as string) ||
              req.socket.remoteAddress ||
              '0.0.0.0';
            const userAgent = req.headers['user-agent'] || 'Unknown';

            let location: string | null = null;
            try {
              const response = await firstValueFrom(this.http.get(envs.ipGeoLocation));
              const { city, region, country_name } = response.data;
              location = `${city}, ${region}, ${country_name}`;
            } catch (geoErr) {
              console.warn('[Middleware] Fallo al obtener geolocalización:', geoErr.message);
            }

            await this.prisma.loginAudit.create({
              data: {
                userId: user.id,
                sessionId: user.sessionId,
                ip: ip.toString(),
                device: userAgent,
                location,
              },
            });

            console.log('[Middleware] Auditoría de login guardada exitosamente');
          } catch (dbErr) {
            console.error('[Middleware] Error al guardar auditoría:', dbErr.message);
          }
        }
      });
    }

    next();
  }
}
