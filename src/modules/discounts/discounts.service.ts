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

  async create(dto: CreateDiscountDto, req) {
    // Usuario extraído del JWT
    const user = req['user'];
    if (!user || !user.userId) {
      throw new BadRequestException('Usuario no autenticado o información de usuario incompleta');
    }

    // Validar que venga monto o porcentaje, nunca ambos
    if ((!dto.amount && !dto.percentageId) || (dto.amount && dto.percentageId)) {
      throw new BadRequestException('Debe especificar un solo tipo de descuento: monto o porcentaje');
    }
    if (dto.amount && dto.amount <= 0) {
      throw new BadRequestException('El monto del descuento debe ser mayor a cero');
    }

    // Validar que solo uno de los dos rubros sea recibido
    const targetIds = [dto.installmentId, dto.moratoryId].filter(id => id != null);
    if (targetIds.length !== 1) {
      throw new BadRequestException(
        'El descuento solo puede aplicarse a un rubro a la vez: cuota o interés moratorio'
      );
    }

    return await this.prisma.$transaction(async tx => {
      let discountAmount: Prisma.Decimal = new Prisma.Decimal(0);
      let target!: "installment" | "moratory";
      let targetDescription: string = '';

      const calculateAmountFromPercentage = async (base: Prisma.Decimal, percentageId: number) => {
        const percentage = await tx.percentageDiscount.findUnique({ where: { id: percentageId } });
        if (!percentage) throw new BadRequestException('Percentage inválido');
        return base.times(percentage.value / 100);
      };

      // --------------------------
      // Caso 1: Descuento a cuota
      // --------------------------
      if (dto.installmentId) {
        target = 'installment';
        targetDescription = 'cuota';
        const installment = await tx.installment.findUnique({ where: { id: dto.installmentId } });
        if (!installment) throw new BadRequestException('Cuota no encontrada');
        if (installment.isPaid) throw new BadRequestException('No se puede aplicar descuento a cuota ya pagada');

        discountAmount = dto.amount
          ? new Prisma.Decimal(dto.amount)
          : await calculateAmountFromPercentage(new Prisma.Decimal(installment.interestAmount), dto.percentageId!);

        if (discountAmount.greaterThan(installment.interestAmount))
          throw new BadRequestException('El descuento no puede ser mayor al interés de la cuota');

        const newInterestAmount = new Prisma.Decimal(installment.interestAmount).minus(discountAmount);
        const newTotalAmount = new Prisma.Decimal(installment.capitalAmount).plus(newInterestAmount);

        await tx.installment.update({
          where: { id: dto.installmentId },
          data: {
            interestAmount: newInterestAmount.toNumber(),
            totalAmount: newTotalAmount.toNumber(),
          },
        });

        // --------------------------
        // Caso 2: Descuento a interés moratorio
        // --------------------------
      } else if (dto.moratoryId) {
        target = 'moratory';
        targetDescription = 'interés moratorio';
        const moratory = await tx.moratoryInterest.findUnique({ where: { id: dto.moratoryId } });
        if (!moratory) throw new BadRequestException('Interés moratorio no encontrado');
        if (moratory.amount <= 0) throw new BadRequestException('No existe interés moratorio generado');

        discountAmount = dto.amount
          ? new Prisma.Decimal(dto.amount)
          : await calculateAmountFromPercentage(new Prisma.Decimal(moratory.amount), dto.percentageId!);

        if (discountAmount.greaterThan(moratory.amount))
          throw new BadRequestException('El descuento no puede ser mayor al interés moratorio existente');

        if (discountAmount.lessThanOrEqualTo(0)) {
          throw new BadRequestException('El descuento debe ser mayor a cero');
        }

        await tx.moratoryInterest.update({
          where: { id: dto.moratoryId },
          data: { amount: new Prisma.Decimal(moratory.amount).minus(discountAmount).toNumber() },
        });
      }

      // --------------------------
      // Crear descripción completa
      // --------------------------
      const baseDescription = dto.description ? `${dto.description}. ` : '';
      const percentageText = dto.percentageId
        ? `${discountAmount.toNumber()} (${dto.percentageId}%)`
        : discountAmount.toNumber().toString();
      const appliedDescription = `DESCRIPCIÓN APLICADA POR EL SISTEMA: descuento aplicado a ${targetDescription} de ${percentageText}, generado por: ${user.userId} - ${user.email || 'N/A'}`;

      // --------------------------
      // Crear registro de descuento
      // --------------------------
      const discount = await tx.discount.create({
        data: {
          discountTypeId: dto.discountTypeId,
          installmentId: dto.installmentId,
          moratoryId: dto.moratoryId,
          description: baseDescription + appliedDescription,
          amount: dto.amount ? new Prisma.Decimal(dto.amount) : null,
          percentageId: dto.percentageId || null,
          createdBy: user.userId,
        },
      });

      return this.convertDiscountToPlain(discount);
    });
  }


  //   // ---------------- APPLY DISCOUNTS ----------------
  //   private async applyMoratoryInterestDiscount(
  //     tx: any,
  //     dto: CreateDiscountDto,
  //     installment: any,
  //   ) {
  //     if (!installment)
  //       throw new BadRequestException(
  //         'Se requiere especificar una cuota para descuento de interés moratorio',
  //       );
  // 
  //     const moratoryInterest = await tx.moratoryInterest.findUnique({
  //       where: { installmentId: installment.id },
  //     });
  // 
  //     if (!moratoryInterest)
  //       throw new BadRequestException(
  //         'No existe interés moratorio para esta cuota',
  //       );
  //     if (dto.amount > moratoryInterest.amount)
  //       throw new BadRequestException(
  //         'El descuento no puede ser mayor al interés moratorio existente',
  //       );
  // 
  //     await tx.moratoryInterest.update({
  //       where: { installmentId: installment.id },
  //       data: { amount: moratoryInterest.amount - dto.amount },
  //     });
  // 
  //     return moratoryInterest;
  //   }
  // 
  //   private async applyLoanInterestDiscount(
  //     tx: any,
  //     dto: CreateDiscountDto,
  //     loan: any,
  //     installment: any,
  //   ) {
  //     if (installment) {
  //       if (dto.amount > installment.interestAmount.toNumber())
  //         throw new BadRequestException(
  //           'El descuento no puede ser mayor al interés de la cuota',
  //         );
  // 
  //       await tx.installment.update({
  //         where: { id: installment.id },
  //         data: {
  //           interestAmount: new Prisma.Decimal(
  //             installment.interestAmount.toNumber() - dto.amount,
  //           ),
  //           totalAmount: new Prisma.Decimal(
  //             installment.totalAmount.toNumber() - dto.amount,
  //           ),
  //         },
  //       });
  //     } else if (loan) {
  //       const unpaidInstallments = await tx.installment.findMany({
  //         where: { loanId: loan.id, isPaid: false, isActive: true },
  //       });
  // 
  //       const totalUnpaidInterest = unpaidInstallments.reduce(
  //         (sum, inst) => sum + inst.interestAmount.toNumber(),
  //         0,
  //       );
  // 
  //       if (dto.amount > totalUnpaidInterest)
  //         throw new BadRequestException(
  //           'El descuento no puede ser mayor al interés pendiente del préstamo',
  //         );
  // 
  //       for (const inst of unpaidInstallments) {
  //         const proportion = inst.interestAmount.toNumber() / totalUnpaidInterest;
  //         const discountForInstallment = dto.amount * proportion;
  // 
  //         await tx.installment.update({
  //           where: { id: inst.id },
  //           data: {
  //             interestAmount: new Prisma.Decimal(
  //               inst.interestAmount.toNumber() - discountForInstallment,
  //             ),
  //             totalAmount: new Prisma.Decimal(
  //               inst.totalAmount.toNumber() - discountForInstallment,
  //             ),
  //           },
  //         });
  //       }
  //     }
  //   }
  // 
  //   private async applyCapitalDiscount(tx: any, dto: CreateDiscountDto, loan: any) {
  //     if (!loan)
  //       throw new BadRequestException(
  //         'Se requiere especificar un préstamo para descuento de capital',
  //       );
  //     if (dto.amount > loan.remainingBalance.toNumber())
  //       throw new BadRequestException(
  //         'El descuento no puede ser mayor al saldo pendiente',
  //       );
  // 
  //     await tx.loan.update({
  //       where: { id: loan.id },
  //       data: {
  //         remainingBalance: new Prisma.Decimal(
  //           loan.remainingBalance.toNumber() - dto.amount,
  //         ),
  //       },
  //     });
  // 
  //     // Registro de pago de trazabilidad
  //     await tx.payment.create({
  //       data: {
  //         loanId: loan.id,
  //         amount: new Prisma.Decimal(dto.amount),
  //         paymentTypeId: 3, // 👈 deberías tener en PaymentType "DISCOUNT" o similar
  //         appliedToCapital: new Prisma.Decimal(dto.amount),
  //         appliedToInterest: new Prisma.Decimal(0),
  //         appliedToLateFee: new Prisma.Decimal(0),
  //         date: new Date(),
  //       },
  //     });
  //   }

  // ---------------- FIND ALL DISCOUNTS ----------------
  async findAll(paginationDto: DiscountPaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const where: Prisma.DiscountWhereInput = {};

    if (paginationDto?.moratoryId) where.moratoryId = paginationDto.moratoryId;
    if (paginationDto?.installmentId) where.installmentId = paginationDto.installmentId;
    if (paginationDto?.loanId) where.loanId = paginationDto.loanId;

    const totalItems = await this.prisma.discount.count({ where });

    const lastPage = Math.ceil(totalItems / limit || 1);
    if (page > lastPage) {
      throw new BadRequestException(`La página #${page} no existe`);
    }


    const discounts = await this.prisma.discount.findMany({
      where,
      include: {
        discountType: true,
        loan: true,
        installment: true,
        moratory: true,
        createdByUser: true,
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