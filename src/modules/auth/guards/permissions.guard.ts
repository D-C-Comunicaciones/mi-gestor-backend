import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@infraestructure/redis/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { jti: string };

    const session = await this.redis.get(`session:${user.jti}`);
    if (!session) {
      throw new UnauthorizedException('Sesión no encontrada');
    }

    const { permissions } = JSON.parse(session);
    const requiredPermissions = this.getRequiredPermissions(context);

    // Si tiene AllPermissions, permitir todo
    if (permissions.includes('all.permissions')) {
      return true;
    }

    // Validar permisos requeridos
    const missing = requiredPermissions.filter(
      (perm) => !permissions.includes(perm),
    );

    if (missing.length > 0) {
      // Puedes usar solo el primero si hay muchos
      throw new ForbiddenException(
        `No tienes permiso para ${this.formatPermission(missing[0])}`,
      );
    }

    return true;
  }

  private getRequiredPermissions(context: ExecutionContext): string[] {
    return Reflect.getMetadata('permissions', context.getHandler()) || [];
  }

  private formatPermission(permission: string): string {

    // Mapa de permisos a mensajes en español
    
    const map: Record<string, string> = {

      //roles messages
      'create roles': 'crear roles',
      'list roles': 'listar roles',
      'view role': 'ver información de roles',
      'update roles': 'actualizar roles',
      'change roles status': 'cambiar estado de roles',
      'assign permissions to roles': 'asignar permisos a roles',
      'revoke permissions from roles': 'revocar permisos de roles',


      //permissions messages
      'create permissions': 'crear permisos',
      'list permissions': 'listar permisos',
      'view permission': 'ver información de permisos',
      'update permissions': 'actualizar permisos',
      'change permissions status': 'cambiar estado de permisos',

      // assign/revoke roles to users
      'assign roles to users': 'asignar roles a usuarios',
      'revoke roles to users': 'revocar roles a usuarios',

      // Otros permisos
      // Agrega más si lo deseas
    };

    return map[permission] || permission;
  }
}