import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountPaginationDto } from './dto';
import { Request } from 'express';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
  ) { }

  async create(dto: CreateDiscountDto, req: Request) {
    const user = req['user'];
    if (!user || !user.userId) {
      throw new BadRequestException('Usuario no autenticado o información de usuario incompleta');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del descuento debe ser mayor a cero');
    }

    return await this.prisma.$transaction(async (tx) => {
      // ✅ Obtener los estados necesarios
      const statuses = await tx.moratoryInterestStatus.findMany({
        where: {
          name: {
            in: ['Unpaid', 'Paid', 'Partially Paid', 'Partially Discounted', 'Discounted'],
            mode: 'insensitive',
          },
        },
      });

      const getStatusId = (name: string) =>
        statuses.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id;

      const unpaidStatusId = getStatusId('Unpaid');
      const partiallyPaidStatusId = getStatusId('Partially Paid');
      const partiallyDiscountedStatusId = getStatusId('Partially Discounted');
      const discountedStatusId = getStatusId('Discounted');

      if (!unpaidStatusId || !partiallyDiscountedStatusId || !discountedStatusId) {
        throw new BadRequestException('No se encontraron los estados de moratorio requeridos');
      }

      // ✅ Obtener cuotas con intereses moratorios aplicables
      const installments = await tx.installment.findMany({
        where: { loanId: dto.loanId, isActive: true },
        orderBy: { sequence: 'asc' },
        include: {
          moratoryInterests: {
            where: {
              isPaid: false,
              moratoryInterestStatus: {
                name: {
                  in: ['Unpaid', 'Partially Paid', 'Partially Discounted'],
                  mode: 'insensitive',
                },
              },
            },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!installments || installments.length === 0) {
        throw new BadRequestException('No se encontraron cuotas activas con intereses moratorios aplicables');
      }

      // ✅ Calcular total de intereses moratorios elegibles
      let totalPendingMoratory = new Prisma.Decimal(0);
      for (const installment of installments) {
        for (const moratory of installment.moratoryInterests) {
          totalPendingMoratory = totalPendingMoratory.plus(new Prisma.Decimal(moratory.amount));
        }
      }

      if (new Prisma.Decimal(dto.amount).greaterThan(totalPendingMoratory)) {
        throw new BadRequestException(
          `El monto del descuento (${dto.amount}) excede el total de intereses moratorios pendientes (${totalPendingMoratory.toNumber()})`
        );
      }

      // ✅ Aplicar descuentos
      let remainingDiscount = new Prisma.Decimal(dto.amount);
      const appliedDiscounts: any[] = [];

      for (const installment of installments) {
        for (const moratory of installment.moratoryInterests) {
          if (remainingDiscount.lte(0)) break;

          const moratoryAmount = new Prisma.Decimal(moratory.amount);
          const discountToApply = remainingDiscount.greaterThan(moratoryAmount)
            ? moratoryAmount
            : remainingDiscount;

          const isTotalDiscount = discountToApply.equals(moratoryAmount);
          const discountTypeLabel = isTotalDiscount ? 'DESCUENTO TOTAL' : 'DESCUENTO PARCIAL';

          // ✅ Actualizar moratorio (sin modificar amount)
          await tx.moratoryInterest.update({
            where: { id: moratory.id },
            data: {
              isDiscounted: isTotalDiscount,
              moratoryInterestStatusId: isTotalDiscount
                ? discountedStatusId
                : partiallyDiscountedStatusId,
            },
          });

          // 📝 Descripción del descuento aplicado
          const baseDescription = dto.description ? `${dto.description}. ` : '';
          const appliedDescription = `DESCRIPCIÓN APLICADA POR EL SISTEMA: ${discountTypeLabel} de ${discountToApply.toNumber()} aplicado a interés moratorio ID ${moratory.id} (cuota ${installment.sequence}), generado por: ${user.userId} - ${user.email || 'N/A'}`;

          // 💾 Crear registro del descuento
          const discountRecord = await tx.discount.create({
            data: {
              discountTypeId: dto.discountTypeId,
              loanId: dto.loanId,
              installmentId: installment.id,
              moratoryId: moratory.id,
              description: baseDescription + appliedDescription,
              amount: discountToApply,
              createdBy: user.userId,
            },
          });

          appliedDiscounts.push(discountRecord);
          remainingDiscount = remainingDiscount.minus(discountToApply);

          if (remainingDiscount.lte(0)) break;
        }
        if (remainingDiscount.lte(0)) break;
      }

      return appliedDiscounts.map((d) => this.convertDiscountToPlain(d));
    });
  }

  // ---------------- FIND ALL DISCOUNTS ----------------
  async findAll(paginationDto: DiscountPaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const where: Prisma.DiscountWhereInput = {};

    // Filtros específicos
    if (paginationDto?.moratoryId) where.moratoryId = paginationDto.moratoryId;
    if (paginationDto?.discountTypeId) where.discountTypeId = paginationDto.discountTypeId;

    // Búsqueda por descripción
    if (paginationDto?.search) {
      where.description = {
        contains: paginationDto.search,
        mode: 'insensitive'
      };
    }

    const totalItems = await this.prisma.discount.count({ where });

    const lastPage = Math.ceil(totalItems / limit || 1);
    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const discounts = await this.prisma.discount.findMany({
      where,
      include: {
        discountType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        moratory: {
          select: {
            id: true,
            amount: true,
            installmentId: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      discounts: discounts.map(d => this.convertDiscountToPlain(d)),
      meta: {
        totalItems,
        page,
        lastPage: Math.ceil(totalItems / limit),
        limit,
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ---------------- UTIL ----------------
  private convertDiscountToPlain(obj: any): any {
    const jsonString = JSON.stringify(obj, (key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        value.constructor?.name === 'Decimal'
      ) {
        return value.toNumber();
      }
      return value;
    });

    return JSON.parse(jsonString);
  }
}