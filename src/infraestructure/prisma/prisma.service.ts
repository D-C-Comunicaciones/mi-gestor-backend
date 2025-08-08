import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly cls: ClsService) {
    super();

    this.$use(async (params, next) => {
      const { model, action, args } = params;

      // Excluir modelos que no se desean auditar
      const excludedModels = ['Change', 'LoginAudit'];

      if (
        !model ||
        excludedModels.includes(model) ||
        !['create', 'update', 'delete'].includes(action)
      ) {
        return next(params);
      }

      let before: Prisma.InputJsonValue | typeof Prisma.JsonNull =
        Prisma.JsonNull;
      let after: Prisma.InputJsonValue | typeof Prisma.JsonNull =
        Prisma.JsonNull;

      // Obtener estado previo para update y delete
      if (['update', 'delete'].includes(action)) {
        try {
          before =
            (await this[model].findUnique({ where: args.where })) ??
            Prisma.JsonNull;
        } catch (err) {
          console.warn(
            `[AUDIT] Error al obtener estado anterior de ${model}:`,
            err,
          );
        }
      }

      const result = await next(params);

      // Obtener estado posterior para create y update
      if (['create', 'update'].includes(action)) {
        after = result ?? Prisma.JsonNull;
      }

      // Obtener userId del contexto CLS
      let userId = this.cls.get('userId');
      if (!userId) {
        userId = 1; // ✅ asigna por defecto
      }
      try {
        await this.change.create({
          data: {
            model,
            action,
            before,
            after,
            userId,
          },
        });
      } catch (err) {
        console.error('[AUDIT] Error al registrar cambio:', err);
      }

      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
