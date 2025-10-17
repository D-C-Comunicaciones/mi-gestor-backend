// src/modules/collections/collections.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, PaymentAllocation, PositiveBalance } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionPaginationDto } from './dto/collection-pagination.dto';
import { HistoryCollectionQueryDto } from './dto';

type InstallmentWithLoan = Prisma.InstallmentGetPayload<{
  include: {
    loan: {
      include: {
        installments: {
          include: {
            status: true;
            moratoryInterests: true;
            paymentAllocations: true;
          };
        };
        loanStatus: true;
        loanType: true;
      };
    };
    paymentAllocations: true;
  };
}>;

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateCollectionDto, req) {
    const user = req['user'];
    if (!user?.userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: dto.loanId },
        include: {
          installments: {
            include: {
              status: true,
              moratoryInterests: { include: { discounts: true } },
              paymentAllocations: true,
            },
            orderBy: { sequence: 'asc' },
          },
          loanStatus: true,
          loanType: true,
        },
      });

      if (!loan) throw new BadRequestException('El préstamo no existe.');

      const activeInstallments = loan.installments.filter((i) => i.isActive !== false);
      if (activeInstallments.length === 0) {
        throw new BadRequestException('El préstamo no tiene cuotas activas.');
      }

      const mostRecentInstallment = activeInstallments.sort((a, b) => b.sequence - a.sequence)[0];
      const targetInstallment = mostRecentInstallment;

      if (loan.loanStatus.name === 'Cancelled')
        throw new BadRequestException('El crédito está cancelado, no puede gestionarse.');
      if (loan.loanStatus.name === 'Refinanced')
        throw new BadRequestException('El crédito está refinanciado, verifique el nuevo crédito.');

      const [
        paidStatus,
        pendingStatus,
        upToDateStatus,
        outstandingStatus,
        loanPaidStatus,
      ] = await Promise.all([
        tx.installmentStatus.findFirst({ where: { name: 'Paid' } }),
        tx.installmentStatus.findFirst({ where: { name: 'Pending' } }),
        tx.loanStatus.findFirst({ where: { name: 'Up to Date' } }),
        tx.loanStatus.findFirst({ where: { name: 'Outstanding Balance' } }),
        tx.loanStatus.findFirst({ where: { name: 'Paid' } }),
      ]);

      if (!paidStatus || !pendingStatus || !upToDateStatus || !outstandingStatus || !loanPaidStatus)
        throw new BadRequestException('No se encontraron los estados requeridos.');

      if (loan.loanStatus.name === 'Paid') {
        throw new BadRequestException('El crédito ya está pagado en su totalidad.');
      }

      const [miPaidStatus, miPartiallyStatus, miUnpaidStatus] = await Promise.all([
        tx.moratoryInterestStatus.findFirst({ where: { name: 'paid' } }),
        tx.moratoryInterestStatus.findFirst({ where: { name: 'partially paid' } }),
        tx.moratoryInterestStatus.findFirst({ where: { name: 'unpaid' } }),
      ]);

      const payment = await tx.payment.create({
        data: {
          loanId: loan.id,
          amount: dto.amount,
          paymentTypeId: 1,
          paymentMethodId: dto.paymentMethodId || 1,
          paymentDate: new Date(),
          recordedByUserId: user.userId,
        },
      });

      const allocations: Omit<PaymentAllocation, 'id'>[] = [];
      let totalCapital = new Decimal(0);
      let totalInterest = new Decimal(0);
      let totalLateFee = new Decimal(0);
      let remainingAmount = new Decimal(dto.amount);

      const sumAppliedFromAllocations = (inst: typeof loan.installments[number]) => {
        const paidCapital = inst.paymentAllocations.reduce(
          (acc, a) => acc.plus(a.appliedToCapital ?? 0),
          new Decimal(0),
        );
        const paidInterest = inst.paymentAllocations.reduce(
          (acc, a) => acc.plus(a.appliedToInterest ?? 0),
          new Decimal(0),
        );
        return { paidCapital, paidInterest };
      };

      // ============================================================
      // 🟥 PASO 1: Aplicar pagos a intereses moratorios
      // ============================================================

      const allPendingMoratories = await tx.moratoryInterest.findMany({
        where: {
          installment: { loanId: loan.id, isActive: true },
          isPaid: false,
          moratoryInterestStatus: { name: { in: ['unpaid', 'partially paid', 'partially discounted'] } },
        },
        include: {
          discounts: true,
          installment: true,
        },
        orderBy: [
          { installment: { sequence: 'asc' } },
          { id: 'asc' },
        ],
      });

      for (const mora of allPendingMoratories) {
        if (remainingAmount.lte(0)) break;

        // 1️⃣ Sumar todos los descuentos asociados
        const totalDiscounts = mora.discounts.reduce(
          (acc, d) => acc.plus(d.amount ?? 0),
          new Decimal(0),
        );

        // 2️⃣ Tomar lo ya abonado
        const paidSoFar = new Decimal(mora.paidAmount ?? 0);
        const totalMoratory = new Decimal(mora.amount ?? 0);

        // 3️⃣ Calcular pendiente real
        const pendienteReal = Decimal.max(totalMoratory.minus(totalDiscounts.plus(paidSoFar)), 0);

        if (pendienteReal.lte(0)) {
          // Ya está completamente cubierto
          await tx.moratoryInterest.update({
            where: { id: mora.id },
            data: {
              isPaid: true,
              moratoryInterestStatusId: miPaidStatus?.id,
              paidAmount: totalMoratory.toNumber(),
              paidAt: new Date(),
            },
          });
          continue;
        }

        // 4️⃣ Aplicar lo que se pueda pagar
        const toApply = Decimal.min(remainingAmount, pendienteReal);
        const newPaidAmount = paidSoFar.plus(toApply);
        const fullyCovered = newPaidAmount.plus(totalDiscounts).gte(totalMoratory);

        await tx.moratoryInterest.update({
          where: { id: mora.id },
          data: {
            paidAmount: newPaidAmount.toNumber(),
            paidAt: new Date(),
            isPaid: fullyCovered,
            moratoryInterestStatusId: fullyCovered
              ? miPaidStatus?.id
              : miPartiallyStatus?.id,
          },
        });

        allocations.push({
          paymentId: payment.id,
          installmentId: mora.installmentId,
          appliedToCapital: new Decimal(0),
          appliedToInterest: new Decimal(0),
          appliedToLateFee: toApply,
          createdAt: new Date(),
        });

        totalLateFee = totalLateFee.plus(toApply);
        remainingAmount = remainingAmount.minus(toApply);
      }

      // ============================================================
      // 🟦 PASO 2: Aplicar pagos a cuotas con saldos pendientes
      // ============================================================
      const orderedInstallments = activeInstallments.sort((a, b) => a.sequence - b.sequence);

      for (const inst of orderedInstallments) {
        if (remainingAmount.lte(0)) break;
        if (inst.id === targetInstallment.id) continue;

        const { paidCapital, paidInterest } = sumAppliedFromAllocations(inst);
        const pendingInterest = Decimal.max(new Decimal(inst.interestAmount ?? 0).minus(paidInterest), 0);
        const pendingCapital = Decimal.max(new Decimal(inst.capitalAmount ?? 0).minus(paidCapital), 0);

        let appliedInterest = new Decimal(0);
        let appliedCapital = new Decimal(0);

        if (pendingInterest.gt(0) && remainingAmount.gt(0)) {
          const toApply = Decimal.min(pendingInterest, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);
          appliedInterest = appliedInterest.plus(toApply);
        }

        if (remainingAmount.gt(0) && appliedInterest.plus(paidInterest).gte(new Decimal(inst.interestAmount ?? 0))) {
          if (pendingCapital.gt(0)) {
            const toApply = Decimal.min(pendingCapital, remainingAmount);
            remainingAmount = remainingAmount.minus(toApply);
            appliedCapital = appliedCapital.plus(toApply);
          }
        }

        if (appliedInterest.gt(0) || appliedCapital.gt(0)) {
          const newPaidAmount = new Decimal(inst.paidAmount ?? 0)
            .plus(appliedInterest)
            .plus(appliedCapital);

          const isNowPaid =
            appliedCapital.plus(paidCapital).gte(new Decimal(inst.capitalAmount ?? 0)) &&
            appliedInterest.plus(paidInterest).gte(new Decimal(inst.interestAmount ?? 0));

          await tx.installment.update({
            where: { id: inst.id },
            data: {
              paidAmount: newPaidAmount,
              isPaid: isNowPaid,
              statusId: isNowPaid ? paidStatus.id : pendingStatus.id,
              paidAt: isNowPaid ? new Date() : null,
            },
          });

          allocations.push({
            paymentId: payment.id,
            installmentId: inst.id,
            appliedToCapital: appliedCapital,
            appliedToInterest: appliedInterest,
            appliedToLateFee: new Decimal(0),
            createdAt: new Date(),
          });

          totalCapital = totalCapital.plus(appliedCapital);
          totalInterest = totalInterest.plus(appliedInterest);
        }
      }

      // ============================================================
      // 🟩 PASO 3: Aplicar pago a la cuota destino
      // ============================================================
      // (mantiene exactamente igual que tu versión original)
      const { paidCapital: tPaidCapital, paidInterest: tPaidInterest } =
        sumAppliedFromAllocations(targetInstallment);
      let tAppliedInterest = new Decimal(0);
      let tAppliedCapital = new Decimal(0);

      const targetPendingInterest = Decimal.max(
        new Decimal(targetInstallment.interestAmount ?? 0).minus(tPaidInterest),
        0,
      );

      if (targetPendingInterest.gt(0) && remainingAmount.gt(0)) {
        const toApply = Decimal.min(targetPendingInterest, remainingAmount);
        remainingAmount = remainingAmount.minus(toApply);
        tAppliedInterest = tAppliedInterest.plus(toApply);
      }

      if (remainingAmount.gt(0) && tAppliedInterest.plus(tPaidInterest).gte(new Decimal(targetInstallment.interestAmount ?? 0))) {
        const pendingCapital = Decimal.max(
          new Decimal(targetInstallment.capitalAmount ?? 0).minus(tPaidCapital),
          0,
        );
        if (pendingCapital.gt(0)) {
          const toApply = Decimal.min(pendingCapital, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);
          tAppliedCapital = tAppliedCapital.plus(toApply);
        }
      }

      if (tAppliedInterest.gt(0) || tAppliedCapital.gt(0)) {
        const newPaidAmount = new Decimal(targetInstallment.paidAmount ?? 0)
          .plus(tAppliedInterest)
          .plus(tAppliedCapital);

        const isFullyPaid =
          tAppliedCapital.plus(tPaidCapital).gte(new Decimal(targetInstallment.capitalAmount ?? 0)) &&
          tAppliedInterest.plus(tPaidInterest).gte(new Decimal(targetInstallment.interestAmount ?? 0));

        await tx.installment.update({
          where: { id: targetInstallment.id },
          data: {
            paidAmount: newPaidAmount,
            isPaid: isFullyPaid,
            statusId: isFullyPaid ? paidStatus.id : pendingStatus.id,
            paidAt: isFullyPaid ? new Date() : null,
          },
        });

        allocations.push({
          paymentId: payment.id,
          installmentId: targetInstallment.id,
          appliedToCapital: tAppliedCapital,
          appliedToInterest: tAppliedInterest,
          appliedToLateFee: new Decimal(0),
          createdAt: new Date(),
        });

        totalCapital = totalCapital.plus(tAppliedCapital);
        totalInterest = totalInterest.plus(tAppliedInterest);
      }

      // ============================================================
      // 🟨 PASO 4: Excedente o saldo a favor
      // ============================================================
      let positiveBalance: PositiveBalance | undefined;
      if (remainingAmount.gt(0)) {
        if (loan.loanType?.name === 'fixed_fees') {
          const newRemainingBalance = Decimal.max(
            new Decimal(loan.remainingBalance ?? 0).minus(remainingAmount),
            0,
          );
          await tx.loan.update({
            where: { id: loan.id },
            data: { remainingBalance: newRemainingBalance },
          });
          remainingAmount = new Decimal(0);
        } else {
          const existingBalance = await tx.positiveBalance.findFirst({
            where: { loanId: loan.id, isUsed: false },
          });
          if (existingBalance) {
            positiveBalance = await tx.positiveBalance.update({
              where: { id: existingBalance.id },
              data: { amount: new Decimal(existingBalance.amount).plus(remainingAmount) },
            });
          } else {
            positiveBalance = await tx.positiveBalance.create({
              data: { loanId: loan.id, amount: remainingAmount, source: 'overpayment', isUsed: false },
            });
          }
          remainingAmount = new Decimal(0);
        }
      }

      // ============================================================
      // 🟧 PASO 5: Actualizar estado del préstamo
      // ============================================================
      const newRemainingBalance = Decimal.max(
        new Decimal(loan.remainingBalance ?? 0).minus(totalCapital),
        0,
      );
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingBalance: newRemainingBalance,
          loanStatusId: newRemainingBalance.lte(0)
            ? loanPaidStatus.id
            : newRemainingBalance.lt(new Decimal(loan.loanAmount ?? 0))
              ? upToDateStatus.id
              : outstandingStatus.id,
        },
      });

      if (allocations.length > 0) {
        await tx.paymentAllocation.createMany({ data: allocations });
      }

      const dbAllocations = await tx.paymentAllocation.findMany({
        where: { paymentId: payment.id },
        orderBy: { id: 'asc' },
      });

      return {
        paymentId: payment.id,
        loanId: loan.id,
        targetInstallmentSequence: targetInstallment.sequence,
        paymentDate: payment.paymentDate,
        appliedToCapital: totalCapital.toFixed(2),
        appliedToInterest: totalInterest.toFixed(2),
        appliedToLateFee: totalLateFee.toFixed(2),
        excessAmount: positiveBalance ? positiveBalance.amount.toFixed(2) : '0.00',
        newRemainingBalance: newRemainingBalance.toFixed(2),
        isFullyPaid: newRemainingBalance.lte(0),
        allocations: dbAllocations.map((alloc) => ({
          installmentId: alloc.installmentId,
          appliedToCapital: new Decimal(alloc.appliedToCapital ?? 0).toFixed(2),
          appliedToInterest: new Decimal(alloc.appliedToInterest ?? 0).toFixed(2),
          appliedToLateFee: new Decimal(alloc.appliedToLateFee ?? 0).toFixed(2),
        })),
      };
    });
  }


  /**
   * Obtiene el historial de recaudos para un cliente o un préstamo específico.
   */
  async findAllByCustomerOrLoan(query: HistoryCollectionQueryDto) {
    const { customerId, loanId } = query;

    if (!customerId && !loanId) {
      throw new BadRequestException('Debe proporcionar customerId o loanId.');
    }

    const where: Prisma.LoanWhereInput = {};
    if (customerId) where.customerId = customerId;
    if (loanId) where.id = loanId;

    const loansWithPayments = await this.prisma.loan.findMany({
      where,
      include: {
        customer: true,
        loanType: true,
        loanStatus: true,
        payments: {
          include: {
            allocations: {
              include: {
                installment: { select: { sequence: true } },
              },
            },
            paymentMethod: true,
            recordedByUser: {
              select: {
                id: true,
                name: true,
                collector: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { paymentDate: 'asc' },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    if (loansWithPayments.length === 0) {
      return [];
    }

    const result = loansWithPayments.map((loan) => {
      const paymentsDetails = loan.payments.map((payment) => {
        const totalAppliedToCapital = payment.allocations.reduce(
          (sum, alloc) => sum.plus(alloc.appliedToCapital ?? 0),
          new Decimal(0),
        );
        const totalAppliedToInterest = payment.allocations.reduce(
          (sum, alloc) => sum.plus(alloc.appliedToInterest ?? 0),
          new Decimal(0),
        );
        const totalAppliedToLateFee = payment.allocations.reduce(
          (sum, alloc) => sum.plus(alloc.appliedToLateFee ?? 0),
          new Decimal(0),
        );

        const collector = payment.recordedByUser.collector;

        return {
          paymentId: payment.id,
          paymentDate: payment.paymentDate ? payment.paymentDate.toISOString().slice(0, 10) : null,
          paymentAmount: new Decimal(payment.amount).toFixed(2),
          paymentMethod: payment.paymentMethod?.name || 'N/A',
          appliedToCapital: totalAppliedToCapital.toFixed(2),
          appliedToInterest: totalAppliedToInterest.toFixed(2),
          appliedToLateFee: totalAppliedToLateFee.toFixed(2),
          collector: {
            id: collector?.id || payment.recordedByUser.id,
            name: collector
              ? `${collector.firstName} ${collector.lastName}`
              : payment.recordedByUser.name,
          },
        };
      });

      return {
        loanId: loan.id,
        loanAmount: new Decimal(loan.loanAmount).toFixed(2),
        remainingBalance: new Decimal(loan.remainingBalance).toFixed(2),
        loanTypeName: this.translateLoanType(loan.loanType.name),
        loanStatusName: this.translateLoanStatus(loan.loanStatus.name),
        customer: {
          id: loan.customer.id,
          name: `${loan.customer.firstName} ${loan.customer.lastName}`,
          documentNumber: loan.customer.documentNumber,
        },
        payments: paymentsDetails,
      };
    });

    return result;
  }

  // ------------------- findAll (igual que antes) -------------------
  /**
   * Obtiene todos los cobros/pagos con paginación y filtros
   */
  async findAll(paginationDto: CollectionPaginationDto) {
    const { page = 1, limit = 10, loanId, collectorId, startDate, endDate } = paginationDto;

    // Construir filtros
    const where: any = {};

    if (loanId) {
      where.loanId = loanId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    if (collectorId) {
      where.recordedByUser = {
        OR: [
          { collector: { id: collectorId } },
          { id: collectorId } // En caso de que sea el ID del usuario directamente
        ]
      };
    }

    // Obtener total de registros
    const total = await this.prisma.payment.count({ where });

    if (total === 0) {
      return {
        collections: [],
        meta: {
          total: 0,
          page: 1,
          lastPage: 0,
          limit,
          hasNextPage: false,
        },
      };
    }

    const lastPage = Math.ceil(total / limit);
    if (page > lastPage) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    // ✅ Obtener pagos con todas las relaciones necesarias
    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        loan: {
          include: {
            customer: {
              include: {
                typeDocumentIdentification: true,
                zone: true,
              }
            },
            loanType: true,
            loanStatus: true,
          }
        },
        recordedByUser: {
          include: {
            collector: {
              include: {
                typeDocumentIdentification: true,
              }
            }
          }
        },
        allocations: {
          include: {
            installment: true,
          }
        },
        paymentType: true,
        paymentMethod: true, // ✅ Incluir método de pago
      },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mapear los resultados
    const collections = payments.map((payment) => {
      // Calcular totales de las allocations
      const totalCapital = payment.allocations.reduce(
        (sum, alloc) => sum + Number(alloc.appliedToCapital || 0), 0
      );
      const totalInterest = payment.allocations.reduce(
        (sum, alloc) => sum + Number(alloc.appliedToInterest || 0), 0
      );
      const totalLateFee = payment.allocations.reduce(
        (sum, alloc) => sum + Number(alloc.appliedToLateFee || 0), 0
      );

      // Calcular exceso (si el pago fue mayor que lo aplicado)
      const totalApplied = totalCapital + totalInterest + totalLateFee;
      const excessAmount = Math.max(0, Number(payment.amount) - totalApplied);

      return {
        id: payment.id,
        loanId: payment.loanId,
        amount: payment.amount.toFixed(2),
        appliedToCapital: totalCapital.toFixed(2),
        appliedToInterest: totalInterest.toFixed(2),
        appliedToLateFee: totalLateFee.toFixed(2),
        excessAmount: excessAmount.toFixed(2),
        paymentDate: payment.paymentDate.toISOString().replace('T', ' ').slice(0, 19),
        isFullyPaid: Number(payment.loan.remainingBalance) <= 0,
        customer: {
          id: payment.loan.customer.id,
          name: `${payment.loan.customer.firstName} ${payment.loan.customer.lastName}`,
          documentNumber: payment.loan.customer.documentNumber.toString(),
        },
        loan: {
          id: payment.loan.id,
          loanAmount: Number(payment.loan.loanAmount),
          remainingBalance: Number(payment.loan.remainingBalance),
          loanTypeName: this.translateLoanType(payment.loan.loanType.name),
          loanStatusName: this.translateLoanStatus(payment.loan.loanStatus.name),
        },
        collector: {
          id: payment.recordedByUser.collector?.id || payment.recordedByUser.id,
          name: payment.recordedByUser.collector
            ? `${payment.recordedByUser.collector.firstName} ${payment.recordedByUser.collector.lastName}`
            : payment.recordedByUser.name,
          documentNumber: payment.recordedByUser.collector?.documentNumber?.toString() || '',
          phone: payment.recordedByUser.collector?.phone || '',
        },
      };
    });

    return {
      collections,
      meta: {
        total,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage,
      },
    };
  }

  // Métodos auxiliares para traducción
  private translateLoanType(loanTypeName: string): string {
    const translations = {
      'fixed_fees': 'Cuotas Fijas',
      'only_interests': 'Interés Mensual',
    };
    return translations[loanTypeName] || loanTypeName;
  }

  private translateLoanStatus(statusName: string): string {
    const translations = {
      'Up to Date': 'Al día',
      'Overdue': 'En Mora',
      'Paid': 'Pagado',
      'Cancelled': 'Cancelado',
      'Refinanced': 'Refinanciado',
      'Outstanding Balance': 'Saldo Pendiente',
    };
    return translations[statusName] || statusName;
  }
}