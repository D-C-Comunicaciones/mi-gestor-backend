import {  ExceptionFilter,  Catch,  ArgumentsHost,  HttpException,  HttpStatus,  BadRequestException,  UnauthorizedException,  ForbiddenException } from '@nestjs/common';
import { envs } from '@config/envs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception.message || 'Error interno del servidor';
    let code = status;
    let errors: string[] | null = null;

    // 🟡 Validación de DTOs
    if (
      exception instanceof BadRequestException &&
      typeof exception.getResponse === 'function'
    ) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res['message'] && Array.isArray(res['message'])) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        code = status;
        message = 'Los datos enviados no son válidos. Por favor, revise la información e intente nuevamente.';
        errors = res['message'];
      }
    }

    // 🔴 Unauthorized
    if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      code = status;

      const res = typeof exception.getResponse === 'function'
        ? exception.getResponse()
        : null;

      if (res && typeof res === 'object' && 'message' in res) {
        const msg = res['message'];
        if (typeof msg === 'string') {
          if (msg.includes('expirado') || msg.includes('expired')) {
            message = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
          } else if (msg.includes('inválido') || msg.includes('invalid') || msg.includes('malformed')) {
            message = 'Token de autenticación inválido. Por favor, inicie sesión nuevamente.';
          } else if (msg === 'Unauthorized') {
            message = 'Acceso no autorizado. Por favor, inicie sesión para continuar.';
          } else {
            message = msg;
          }
        } else {
          message = 'Acceso no autorizado. Por favor, inicie sesión para continuar.';
        }
      } else {
        message = 'Acceso no autorizado. Por favor, inicie sesión para continuar.';
      }

      errors = null;
    }

    // 🔵 Forbidden
    if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      code = status;

      const res = typeof exception.getResponse === 'function'
        ? exception.getResponse()
        : null;

      if (res && typeof res === 'object' && 'message' in res) {
        const msg = res['message'];
        if (typeof msg === 'string') {
          message = msg === 'Forbidden'
            ? 'No tiene los permisos necesarios para realizar esta acción.'
            : msg;
        } else {
          message = 'Acceso denegado. No tiene los permisos necesarios para realizar esta acción.';
        }
      } else {
        message = 'Acceso denegado. No tiene los permisos necesarios para realizar esta acción.';
      }

      errors = null;
    }

    // ⚪️ Prisma u otros errores personalizados
    if (exception.code && exception.meta) {
      code = exception.code;
      message = exception.meta?.cause || exception.message || 'Error en base de datos';
    }

    // ✅ Respuesta unificada - SOLO los campos que necesitas
    response.status(status).json({
      message,
      code,
      status: 'error',
      errors,
      trace: envs.environment === 'production' ? null : exception.stack || null,
    });
  }
}
