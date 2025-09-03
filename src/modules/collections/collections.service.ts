import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionResponseDto, AllocationResponseDto } from './dto/collection-response.dto';
import { isAfter } from 'date-fns';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCollectionDto): Promise<CollectionResponseDto> {
    return await this.prisma.$transaction(async tx => {
      // 1️⃣ Validar préstamo
      const loan = await tx.loan.findUnique({
        where: { id: dto.loanId },
        include: {
          loanType: true,
          paymentFrequency: true,
          term: true,
        }
      });
      if (!loan) throw new NotFoundException('Préstamo no encontrado');
      if (!loan.isActive) throw new BadRequestException('No se puede recaudar de un préstamo inactivo');

      // 2️⃣ Validar cobrador
      if (dto.collectorId) {
        const collector = await tx.collector.findUnique({ where: { id: dto.collectorId } });
        if (!collector || !collector.isActive) {
          throw new BadRequestException('Cobrador no encontrado o inactivo');
        }
      }

      // 3️⃣ Inicializar
      let remainingPayment = dto.amount;
      let totalAppliedCapital = 0;
      let totalAppliedInterest = 0;
      let totalAppliedLateFee = 0;

      const installments = await tx.installment.findMany({
        where: { loanId: dto.loanId, isPaid: false },
        orderBy: { sequence: 'asc' },
      });

      if (!installments.length) {
        throw new BadRequestException('No hay cuotas pendientes en este préstamo');
      }

      // 🔑 Tipamos allocations correctamente
      const allocations: AllocationResponseDto[] = [];

      for (const installment of installments) {
        if (remainingPayment <= 0) break;

        const pendingAmount = installment.totalAmount.toNumber() - installment.paidAmount.toNumber();
        if (pendingAmount <= 0) continue;

        // Calcular mora
        let moratoryInterest = 0;
        const today = new Date();
        const daysLate = isAfter(today, installment.dueDate) 
          ? Math.floor((today.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        if (daysLate > 0 && loan.penaltyRateId) {
          const penaltyRate = await tx.penaltyRate.findUnique({ where: { id: loan.penaltyRateId } });
          if (penaltyRate) {
            moratoryInterest = installment.capitalAmount.toNumber() * 
              (penaltyRate.value.toNumber() / 100) * (daysLate / 30);
          }
        }

        let appliedToLateFee = 0;
        let appliedToInterest = 0;
        let appliedToCapital = 0;

        // Prioridad: mora → interés → capital
        if (remainingPayment > 0 && moratoryInterest > 0) {
          appliedToLateFee = Math.min(remainingPayment, moratoryInterest);
          remainingPayment -= appliedToLateFee;
        }

        if (remainingPayment > 0) {
          const pendingInterest = Math.max(0, installment.interestAmount.toNumber() - 
            Math.min(installment.interestAmount.toNumber(), installment.paidAmount.toNumber()));
          appliedToInterest = Math.min(remainingPayment, pendingInterest);
          remainingPayment -= appliedToInterest;
        }

        if (remainingPayment > 0) {
          appliedToCapital = Math.min(remainingPayment, installment.capitalAmount.toNumber());
          remainingPayment -= appliedToCapital;
        }

        totalAppliedLateFee += appliedToLateFee;
        totalAppliedInterest += appliedToInterest;
        totalAppliedCapital += appliedToCapital;

        const newPaidAmount = installment.paidAmount.toNumber() + appliedToLateFee + appliedToInterest + appliedToCapital;
        const installmentPaid = newPaidAmount >= installment.totalAmount.toNumber();

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: new Prisma.Decimal(newPaidAmount),
            isPaid: installmentPaid,
            paidAt: installmentPaid ? new Date() : null,
          }
        });

        if (daysLate > 0 && appliedToLateFee > 0) {
          await tx.moratoryInterest.upsert({
            where: { installmentId: installment.id },
            update: { daysLate, amount: appliedToLateFee },
            create: { installmentId: installment.id, daysLate, amount: appliedToLateFee },
          });
        }

        // 👇 Ahora sí, push sin error
        allocations.push({
          installmentId: installment.id,
          appliedToCapital,
          appliedToInterest,
          appliedToLateFee,
        });
      }

      // 4️⃣ Crear pago
      const payment = await tx.payment.create({
        data: {
          loanId: dto.loanId,
          amount: new Prisma.Decimal(dto.amount),
          paymentTypeId: 1, // CAPITAL+INTERÉS+MORA (default)
          collectorId: dto.collectorId,
          appliedToCapital: new Prisma.Decimal(totalAppliedCapital),
          appliedToInterest: new Prisma.Decimal(totalAppliedInterest),
          appliedToLateFee: new Prisma.Decimal(totalAppliedLateFee),
        }
      });

      // 5️⃣ Crear allocations
      for (const alloc of allocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            installmentId: alloc.installmentId,
            appliedToCapital: new Prisma.Decimal(alloc.appliedToCapital),
            appliedToInterest: new Prisma.Decimal(alloc.appliedToInterest),
            appliedToLateFee: new Prisma.Decimal(alloc.appliedToLateFee),
          }
        });
      }

      // 6️⃣ Actualizar saldo préstamo
      const newRemainingBalance = loan.remainingBalance.toNumber() - totalAppliedCapital;
      await tx.loan.update({
        where: { id: dto.loanId },
        data: { remainingBalance: new Prisma.Decimal(Math.max(0, newRemainingBalance)) },
      });

      // 7️⃣ Saldo a favor
      if (remainingPayment > 0) {
        await tx.positiveBalance.create({
          data: {
            customerId: loan.customerId,
            loanId: dto.loanId,
            amount: new Prisma.Decimal(remainingPayment),
            source: 'overpayment',
          }
        });
      }

      return {
        success: true,
        message: 'Recaudo procesado exitosamente',
        paymentId: payment.id,
        loanId: dto.loanId,
        appliedToCapital: totalAppliedCapital,
        appliedToInterest: totalAppliedInterest,
        appliedToLateFee: totalAppliedLateFee,
        excessAmount: remainingPayment > 0 ? remainingPayment : undefined,
        newRemainingBalance: Math.max(0, newRemainingBalance),
        allocations, // 👈 aquí devuelvo el detalle
      };
    });
  }
}
