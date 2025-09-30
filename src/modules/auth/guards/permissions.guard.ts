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
      'change.customers.status': 'cambiar estado de clientes',

      // loan messages
      'view.loans': 'ver información de préstamos',
      'create.loans': 'crear préstamos',
      'update.loans': 'actualizar préstamos',
      'delete.loans': 'eliminar préstamos',

      // assign/revoke roles to users
      'assign roles to users': 'asignar roles a usuarios',
      'revoke roles to users': 'revocar roles a usuarios',

      //reports messages
      'view.reports': 'ver información de reportes',
      'generate.reports': 'generar reportes',

      //changes messages
      'read.changes': 'leer auditorías de cambios',

      // collections messages
      'view.collections': 'ver información de cobranzas',
      'create.collections': 'crear cobranzas',
      'update.collections': 'actualizar cobranzas',
      'delete.collections': 'eliminar cobranzas',

      // payment frequencies messages
      'create.payment-frequencies': 'crear frecuencias de pago',
      'update.payment-frequencies': 'actualizar frecuencias de pago',
      'delete.payment-frequencies': 'eliminar frecuencias de pago',

      // type document identifications messages
      'create.type-document-identifications': 'crear tipos de identificación',
      'update.type-document-identifications': 'actualizar tipos de identificación',
      'delete.type-document-identifications': 'eliminar tipos de identificación',

      // customers messages
      'view.customers': 'ver información de clientes',
      'create.customers': 'crear clientes',
      'update.customers': 'actualizar clientes',
      'delete.customers': 'eliminar clientes',

      // collectors messages
      'view.collectors': 'ver información de cobradores',
      'create.collectors': 'crear cobradores',
      'update.collectors': 'actualizar cobradores',
      'delete.collectors': 'eliminar cobradores',

      // users messages
      'view.users': 'ver información de usuarios',
      'create.users': 'crear usuarios',
      'update.users': 'actualizar usuarios',
      'delete.users': 'eliminar usuarios',

      // roles messages
      'view.roles': 'ver información de roles',
      'create.roles': 'crear roles',
      'update.roles': 'actualizar roles',
      'delete.roles': 'eliminar roles',

      // permissions messages
      'view.permissions': 'ver información de permisos',
      'create.permissions': 'crear permisos',
      'update.permissions': 'actualizar permisos',
      'delete.permissions': 'eliminar permisos',

      // zones messages
      'create.zones': 'crear zonas',
      'update.zones': 'actualizar zonas',
      'delete.zones': 'eliminar zonas',

      // genders messages
      'create.genders': 'crear géneros',
      'update.genders': 'actualizar géneros',
      'delete.genders': 'eliminar géneros',

      //loan-types messages
      'create.loan-types': 'crear tipos de préstamos',
      'update.loan-types': 'actualizar tipos de préstamos',
      'delete.loan-types': 'eliminar tipos de préstamos',

      //interest-rates messages
      'create.interest-rates': 'crear tasas de interés',
      'update.interest-rates': 'actualizar tasas de interés',
      'delete.interest-rates': 'eliminar tasas de interés',

      //penalty-rates messages
      'create.penalty-rates': 'crear tasas de penalidad',
      'update.penalty-rates': 'actualizar tasas de penalidad',
      'delete.penalty-rates': 'eliminar tasas de penalidad',

      //payment-methods messages
      'create.payment-methods': 'crear métodos de pago',
      'update.payment-methods': 'actualizar métodos de pago',
      'delete.payment-methods': 'eliminar métodos de pago',

      //terms messages
      'create.terms': 'crear términos',
      'update.terms': 'actualizar términos',
      'delete.terms': 'eliminar términos',

      //discounts messages
      'create.discounts': 'crear descuentos',
      'update.discounts': 'actualizar descuentos',
      'delete.discounts': 'eliminar descuentos',

      //grace-periods messages
      'create.grace-periods': 'crear períodos de gracia',
      'update.grace-periods': 'actualizar períodos de gracia',
      'delete.grace-periods': 'eliminar períodos de gracia',

      //configurations messages
      'update.configurations': 'actualizar configuraciones',

      //companies messages
      'view.companies': 'ver información de compañías',
      'create.companies': 'crear compañías',
      'update.companies': 'actualizar compañías',
      'delete.companies': 'eliminar compañías',

      //imports messages
      'create.imports': 'crear importaciones',

      //templates messages
      'create.templates': 'crear plantillas',
      'update.templates': 'actualizar plantillas',
      'delete.templates': 'eliminar plantillas',

      //amortizations messages
      'view.amortizations': 'ver información de amortizaciones',
      'create.amortizations': 'crear amortizaciones',
      'update.amortizations': 'actualizar amortizaciones',
      'delete.amortizations': 'eliminar amortizaciones',

      //installments messages
      'view.installments': 'ver información de cuotas',
      'create.installments': 'crear cuotas',
      'update.installments': 'actualizar cuotas',
      'delete.installments': 'eliminar cuotas',

      // Otros permisos
      // Agrega más si lo deseas
    };

    return map[permission] || permission;
  }
}