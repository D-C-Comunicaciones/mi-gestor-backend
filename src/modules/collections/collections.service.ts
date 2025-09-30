// src/modules/collections/collections.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, PaymentAllocation, PositiveBalance } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionPaginationDto } from './dto/collection-pagination.dto';

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
      // Traer la cuota objetivo y loan (sin filtrar moratoryInterests aquí)
      const installment: InstallmentWithLoan | null = await tx.installment.findUnique({
        where: { id: dto.installmentId },
        include: {
          loan: {
            include: {
              installments: {
                include: {
                  status: true,
                  moratoryInterests: true,
                  paymentAllocations: true,
                },
                orderBy: { sequence: 'asc' },
              },
              loanStatus: true,
              loanType: true,
            },
          },
          paymentAllocations: true,
        },
      });

      if (!installment) throw new BadRequestException('La cuota no existe.');

      const loan = installment.loan;

      // Validaciones de estado
      if (loan.loanStatus.name === 'Cancelled')
        throw new BadRequestException('El crédito está cancelado, no puede gestionarse.');
      if (loan.loanStatus.name === 'Refinanced')
        throw new BadRequestException(
          'El crédito está refinanciado, verifique el nuevo crédito y recaude allí.',
        );

      //Obtener ids de los estados de loan (Up to Date , Overdue, Paid, Cancelled, Refinanced, Outstanding Balance)
      const [paidStatus, pendingStatus, upToDateStatus, outstandingStatus, loanPaidStatus] =
        await Promise.all([
          tx.installmentStatus.findFirst({ where: { name: 'Paid' } }),
          tx.installmentStatus.findFirst({ where: { name: 'Pending' } }),
          tx.loanStatus.findFirst({ where: { name: 'Up to Date' } }),
          tx.loanStatus.findFirst({ where: { name: 'Outstanding Balance' } }),
          tx.loanStatus.findFirst({ where: { name: 'Paid' } }),
          tx.loanStatus.findFirst({ where: { name: 'Overdue' } }),
          tx.loanStatus.findFirst({ where: { name: 'Cancelled' } }),
          tx.loanStatus.findFirst({ where: { name: 'Refinanced' } }),
        ]);

      if (!paidStatus || !pendingStatus || !upToDateStatus || !outstandingStatus || !loanPaidStatus)
        throw new BadRequestException('No se encontraron los estados requeridos.');

      // Validar si el crédito ya está pagado en su totalidad
      if(loan.loanStatus.name === 'Paid'){
        throw new BadRequestException('El crédito ya está pagado en su totalidad.');
      }

      if (installment.isPaid === true && installment.statusId === paidStatus?.id) {
        throw new BadRequestException('La cuota ya está pagada.');
      }

      // Obtener ids de estados de moratory (paid, partially paid, unpaid)
      const [miPaidStatus, miPartiallyStatus, miUnpaidStatus] = await Promise.all([
        tx.moratoryInterestStatus.findFirst({ where: { name: 'paid' } }),
        tx.moratoryInterestStatus.findFirst({ where: { name: 'partially paid' } }),
        tx.moratoryInterestStatus.findFirst({ where: { name: 'unpaid' } }),
      ]);

      // ======= Calcular moratorios pendientes del installment objetivo =======
      const pendingMoratoriesForTarget = await tx.moratoryInterest.findMany({
        where: {
          installmentId: installment.id,
          isPaid: false,
          moratoryInterestStatus: { name: { in: ['unpaid', 'partially paid'] } },
        },
        orderBy: { id: 'asc' },
      });

      const totalMoratoryPendingForTarget = pendingMoratoriesForTarget.reduce(
        (acc, m) => {
          const pending = new Decimal(m.amount ?? 0).minus(new Decimal(m.paidAmount ?? 0));
          return acc.plus(Decimal.max(pending, 0));
        },
        new Decimal(0),
      );

      let remainingAmount = new Decimal(dto.amount);

      // -------- Validaciones especiales según tipo de préstamo (antes de crear payment) --------
      if (loan.loanType?.name === 'only_interests') {
        const targetInterest = new Decimal(installment.interestAmount ?? 0);
        const remainingCapital = new Decimal(loan.remainingBalance ?? 0);
        // totalNeeded: moratorios del target + interés corriente de la cuota + capital restante
        const totalNeeded = totalMoratoryPendingForTarget.plus(targetInterest).plus(remainingCapital);

        // Si periodo de gracia expirado y el pago cubre solo interés o menos -> rechazar
        if (loan.requiresCapitalPayment === true) {
          if (new Decimal(dto.amount).lte(targetInterest)) {
            throw new BadRequestException('Periodo de gracia expirado, debe abonar al capital.');
          }
        }

        // Pago exacto de toda la deuda (moratorios del target + interés target + remainingCapital)
        if (new Decimal(dto.amount).eq(totalNeeded)) {
          this.logger.log(`✅ Pago exacto de toda la deuda loanId=${loan.id}`);
        }

        // Si intenta pagar más que lo necesario para saldar TODO -> advertir/rechazar
        const tolerance = new Decimal(50);


        if (new Decimal(dto.amount).gte(totalNeeded) &&
          new Decimal(dto.amount).lte(totalNeeded.plus(tolerance))) {
          // El pago está dentro del rango aceptable: aplica solo lo necesario
          remainingAmount = new Decimal(totalNeeded);
        } else if (new Decimal(dto.amount).gt(totalNeeded.plus(tolerance))) {
          // Pago mucho mayor, ahí sí rechazamos
          throw new BadRequestException(
            `El cliente solo debe pagar ${totalNeeded.toFixed(2)} para saldar la deuda.`
          );
        }
      }

      // ------------- Crear registro payment -------------
      const payment = await tx.payment.create({
        data: {
          loanId: loan.id,
          amount: dto.amount,
          paymentTypeId: 1,
          paymentMethodId: 1,
          recordedByUserId: user.userId,
        },
      });

      // Inicializadores

      const allocations: Omit<PaymentAllocation, 'id'>[] = [];
      let totalCapital = new Decimal(0);
      let totalInterest = new Decimal(0);
      let totalLateFee = new Decimal(0);

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

      // ---------- Fase A: Moras (ahora procesando múltiples MoratoryInterest por cuota) ----------
      const activeInstallments = loan.installments.filter((i) => i.isActive !== false);
      const orderedInstallments = activeInstallments.sort((a, b) => a.sequence - b.sequence);

      for (const inst of orderedInstallments) {
        if (remainingAmount.lte(0)) break;

        // Tomamos los moratorios pendientes de esta cuota (ordenados por id)
        const moratories = (inst.moratoryInterests ?? [])
          .filter((m) => !m.isPaid)
          .sort((a, b) => a.id - b.id);

        for (const mora of moratories) {
          if (remainingAmount.lte(0)) break;

          // Pendiente real = amount - paidAmount
          const moraPaidSoFar = new Decimal(mora.paidAmount ?? 0);
          const moraTotal = new Decimal(mora.amount ?? 0);
          const pendiente = Decimal.max(moraTotal.minus(moraPaidSoFar), 0);

          if (pendiente.lte(0)) continue;

          const toApply = Decimal.min(pendiente, remainingAmount);

          // Si cubrimos completamente este moratorio
          if (toApply.gte(pendiente)) {
            // marcar pagado
            await tx.moratoryInterest.update({
              where: { id: mora.id },
              data: {
                isPaid: true,
                paidAmount: moraPaidSoFar.plus(pendiente).toNumber(),
                paidAt: new Date(),
                moratoryInterestStatusId: miPaidStatus ? miPaidStatus.id : undefined,
              },
            });
          } else {
            // pago parcial
            await tx.moratoryInterest.update({
              where: { id: mora.id },
              data: {
                paidAmount: moraPaidSoFar.plus(toApply).toNumber(),
                paidAt: new Date(),
                moratoryInterestStatusId: miPartiallyStatus ? miPartiallyStatus.id : undefined,
              },
            });
          }

          // Registrar allocation (aplicado a mora -> late fee)
          allocations.push({
            paymentId: payment.id,
            installmentId: inst.id,
            appliedToCapital: new Decimal(0),
            appliedToInterest: new Decimal(0),
            appliedToLateFee: toApply,
            createdAt: new Date(),
          });

          totalLateFee = totalLateFee.plus(toApply);
          remainingAmount = remainingAmount.minus(toApply);
        }
      }

      // ---------- Fase B: Cuotas anteriores (interest -> capital) ----------
      for (const inst of orderedInstallments) {
        if (remainingAmount.lte(0)) break;
        if (inst.id === installment.id) break;

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
          const newPaidAmount = new Decimal(inst.paidAmount ?? 0).plus(appliedInterest).plus(appliedCapital);

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

      // ---------- Fase C: Cuota objetivo (interest -> capital) ----------
      const targetInst = orderedInstallments.find((i) => i.id === installment.id);
      if (!targetInst) throw new BadRequestException('No se encontró la cuota objetivo.');

      const { paidCapital: tPaidCapital, paidInterest: tPaidInterest } = sumAppliedFromAllocations(targetInst);

      let tAppliedInterest = new Decimal(0);
      let tAppliedCapital = new Decimal(0);

      const targetPendingInterest = Decimal.max(
        new Decimal(targetInst.interestAmount ?? 0).minus(tPaidInterest),
        0,
      );

      if (targetPendingInterest.gt(0) && remainingAmount.gt(0)) {
        const toApply = Decimal.min(targetPendingInterest, remainingAmount);
        remainingAmount = remainingAmount.minus(toApply);
        tAppliedInterest = tAppliedInterest.plus(toApply);
      }

      if (remainingAmount.gt(0) && tAppliedInterest.plus(tPaidInterest).gte(new Decimal(targetInst.interestAmount ?? 0))) {
        const pendingCapital = Decimal.max(new Decimal(targetInst.capitalAmount ?? 0).minus(tPaidCapital), 0);
        if (pendingCapital.gt(0)) {
          const toApply = Decimal.min(pendingCapital, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);
          tAppliedCapital = tAppliedCapital.plus(toApply);
        }
      }

      if (tAppliedInterest.gt(0) || tAppliedCapital.gt(0)) {
        const newPaidAmount = new Decimal(targetInst.paidAmount ?? 0).plus(tAppliedInterest).plus(tAppliedCapital);

        const isFullyPaid =
          tAppliedCapital.plus(tPaidCapital).gte(new Decimal(targetInst.capitalAmount ?? 0)) &&
          tAppliedInterest.plus(tPaidInterest).gte(new Decimal(targetInst.interestAmount ?? 0));

        await tx.installment.update({
          where: { id: targetInst.id },
          data: {
            paidAmount: newPaidAmount,
            isPaid: isFullyPaid,
            statusId: isFullyPaid ? paidStatus.id : pendingStatus.id,
            paidAt: isFullyPaid ? new Date() : null,
          },
        });

        allocations.push({
          paymentId: payment.id,
          installmentId: targetInst.id,
          appliedToCapital: tAppliedCapital,
          appliedToInterest: tAppliedInterest,
          appliedToLateFee: new Decimal(0),
          createdAt: new Date(),
        });

        totalCapital = totalCapital.plus(tAppliedCapital);
        totalInterest = totalInterest.plus(tAppliedInterest);
      }

      // ---------- Fase D: PositiveBalance / FixedFees ----------
      let positiveBalance: PositiveBalance | undefined;

      if (remainingAmount.gt(0)) {
        if (loan.loanType?.name === 'fixed_fees') {
          // No se permite PositiveBalance: excedente va directo al remainingBalance
          const newRemainingBalance = Decimal.max(
            new Decimal(loan.remainingBalance ?? 0).minus(remainingAmount),
            0,
          );

          await tx.loan.update({
            where: { id: loan.id },
            data: { remainingBalance: newRemainingBalance },
          });

          this.logger.log(
            `⚠️ Excedente aplicado directo al saldo. loanId=${loan.id}, -${remainingAmount.toFixed(2)}`,
          );

          remainingAmount = new Decimal(0);
        } else {
          // Flujo normal de PositiveBalance
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

      // ---------- Fase E: actualizar loan.remainingBalance y loanStatus ----------
      const newRemainingBalance = Decimal.max(new Decimal(loan.remainingBalance ?? 0).minus(totalCapital), 0);
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

      // ---------- Fase F: persistir allocations y preparar respuesta ----------
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
                zone: true,
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
          zoneName: payment.recordedByUser.collector?.zone?.name || '',
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
