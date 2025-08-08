import { JwtService } from '@nestjs/jwt';

export function decodeToken(token: string, jwtService: JwtService) {
  const payload = jwtService.decode(token);

  if (!payload || typeof payload !== 'object') {
    throw new Error('Token inválido o vacío');
  }

  const { role, permissions } = payload;

  return {
    role,
    permissions,
  };
}