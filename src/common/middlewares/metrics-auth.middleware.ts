import { envs } from '@config/envs';
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MetricsAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token invalido o ausente');
    }

    const token = authHeader.split(' ')[1];

    if (token !== envs.metrics.metricsAccessToken) {
      throw new UnauthorizedException('Token invalido');
    }

    next();
  }
}
