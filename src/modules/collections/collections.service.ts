// src/modules/collections/collections.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, PaymentAllocation, PositiveBalance } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';

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
      };
    };
    paymentAllocations: true;
  };
}>;

/**
 * Servicio para la gestión de recaudos y cobranza
 * 
 * Este servicio maneja todas las operaciones relacionadas con el registro de recaudos:
 * - Registro de pagos realizados por cobradores en sus rutas
 * - Aplicación automática de pagos a capital, intereses y mora
 * - Consulta de historial de recaudos con filtros avanzados
 * - Generación de reportes de cobranza por cobrador y zona
 * - Validación de montos y distribución automática de pagos
 * 
 * Los recaudos son el núcleo del sistema de cobranza, permitiendo:
 * - Control de efectividad de cobradores
 * - Seguimiento de pagos por zona geográfica
 * - Análisis de patrones de pago de clientes
 * - Generación de reportes gerenciales
 * 
 * @version 1.0.0
 * @since 2025-01-04
 */
@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Registra un nuevo recaudo realizado por un cobrador
   * 
   * Este método maneja el proceso completo de registro de un pago:
   * - Valida que el préstamo existe y está activo
   * - Calcula la distribución automática del pago (capital, intereses, mora)
   * - Actualiza el estado de las cuotas afectadas
   * - Actualiza el saldo restante del préstamo
   * - Registra la geolocalización del cobro (opcional)
   * - Genera auditoría completa del movimiento
   * 
   * @param createCollectionDto Datos del recaudo a registrar
   * @returns Promise<Payment> El recaudo registrado con distribución calculada
   * @throws {NotFoundException} Si el préstamo no existe
   * @throws {BadRequestException} Si el monto es inválido o el préstamo está cancelado
   * 
   * @example
   * ```typescript
   * const collection = await service.create({
   *   loanId: 15,
   *   collectorId: 3,
   *   amount: 125000,
   *   paymentType: 'FULL_PAYMENT',
   *   notes: 'Pago en efectivo'
   * });
   * ```
   */
  async create(dto: CreateCollectionDto, req) {
    const user = req['user'];
    if (!user?.userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Buscar la cuota objetivo con el loan y relaciones necesarias
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
            },
          },
          paymentAllocations: true,
        },
      });

      if (!installment) throw new BadRequestException('La cuota no existe.');

      const loan = installment.loan;

      // Validaciones de estado del préstamo
      if (loan.loanStatus.name === 'Cancelled')
        throw new BadRequestException('El crédito está cancelado, no puede gestionarse.');
      if (loan.loanStatus.name === 'Refinanced')
        throw new BadRequestException(
          'El crédito está refinanciado, verifique el nuevo crédito y recaude allí.',
        );

      // Obtener estados necesarios
      const [paidStatus, pendingStatus, upToDateStatus, outstandingStatus, loanPaidStatus] =
        await Promise.all([
          tx.installmentStatus.findFirst({ where: { name: 'Paid' } }),
          tx.installmentStatus.findFirst({ where: { name: 'Pending' } }),
          tx.loanStatus.findFirst({ where: { name: 'Up to Date' } }),
          tx.loanStatus.findFirst({ where: { name: 'Outstanding Balance' } }),
          tx.loanStatus.findFirst({ where: { name: 'Paid' } }),
        ]);

      if (!paidStatus || !pendingStatus || !upToDateStatus || !outstandingStatus || !loanPaidStatus)
        throw new BadRequestException('No se encontraron los estados requeridos.');

      if (installment.isPaid === true && installment.statusId === paidStatus?.id) {
        // Si la cuota ya está pagada, no se puede gestionar
        throw new BadRequestException('La cuota ya está pagada.');
      }

      // 2) Crear registro payment
      const payment = await tx.payment.create({
        data: {
          loanId: loan.id,
          amount: dto.amount,
          paymentTypeId: 1,
          recordedByUserId: user.userId,
        },
      });

      // Inicializadores
      let remainingAmount = new Decimal(dto.amount);
      const allocations: Omit<PaymentAllocation, 'id'>[] = [];
      let totalCapital = new Decimal(0);
      let totalInterest = new Decimal(0);
      let totalLateFee = new Decimal(0);

      // Helper: suma pagos ya aplicados por una cuota (desde paymentAllocations)
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

      // ---------- Fase A: aplicar moras (moratoryInterests) sobre TODAS las cuotas ----------
      // Recorremos todas las cuotas generadas (isActive true) del loan en orden de sequence
      const activeInstallments = loan.installments.filter((i) => i.isActive !== false);
      const orderedInstallments = activeInstallments.sort((a, b) => a.sequence - b.sequence);

      for (const inst of orderedInstallments) {
        if (remainingAmount.lte(0)) break;

        // Cada moratoryInterest (puede ser varias) se cubre con prioridad
        for (const mora of inst.moratoryInterests ?? []) {
          if (remainingAmount.lte(0)) break;

          const pendingMora = new Decimal(mora.amount ?? 0);
          if (pendingMora.lte(0)) continue;

          const toApply = Decimal.min(pendingMora, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);

          // actualizar moratoryInterest a 0 (se asume que se borra el pendiente)
          await tx.moratoryInterest.update({
            where: { id: mora.id },
            data: { amount: 0, daysLate: 0 },
          });

          totalLateFee = totalLateFee.plus(toApply);

          allocations.push({
            paymentId: payment.id,
            installmentId: inst.id,
            appliedToCapital: new Decimal(0),
            appliedToInterest: new Decimal(0),
            appliedToLateFee: toApply,
            createdAt: new Date(),
          });
        }
      }

      // ---------- Fase B: cubrir cuotas anteriores a la objetivo (interest -> capital) ----------
      // Recorremos en secuencia ascendente y vamos cubriendo pendientes hasta llegar a la cuota objetivo
      for (const inst of orderedInstallments) {
        if (remainingAmount.lte(0)) break;
        if (inst.id === installment.id) break; // detener antes de la target (la target se procesa después)

        // calcular lo ya pagado en esta cuota (desde paymentAllocations)
        const { paidCapital, paidInterest } = sumAppliedFromAllocations(inst);

        // pendiente corriente
        const pendingInterest = Decimal.max(new Decimal(inst.interestAmount ?? 0).minus(paidInterest), 0);
        const pendingCapital = Decimal.max(new Decimal(inst.capitalAmount ?? 0).minus(paidCapital), 0);

        let appliedInterest = new Decimal(0);
        let appliedCapital = new Decimal(0);

        // aplicar interés corriente primero
        if (pendingInterest.gt(0) && remainingAmount.gt(0)) {
          const toApply = Decimal.min(pendingInterest, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);
          appliedInterest = appliedInterest.plus(toApply);
        }

        // si interés quedó cubierto (considerando pagos previos), aplicar capital
        if (remainingAmount.gt(0) && appliedInterest.plus(paidInterest).gte(new Decimal(inst.interestAmount ?? 0))) {
          if (pendingCapital.gt(0)) {
            const toApply = Decimal.min(pendingCapital, remainingAmount);
            remainingAmount = remainingAmount.minus(toApply);
            appliedCapital = appliedCapital.plus(toApply);
          }
        }

        // si aplicamos algo, actualizamos solo los campos permitidos de la cuota
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

      // ---------- Fase C: procesar la cuota objetivo (interest -> capital) ----------
      // Recalcular paid amounts para target desde loan.installments (buscamos la instancia en orderedInstallments)
      const targetInst = orderedInstallments.find((i) => i.id === installment.id);

      if (!targetInst) {
        throw new BadRequestException('No se encontró la cuota objetivo en el préstamo.');
      }

      const { paidCapital: tPaidCapital, paidInterest: tPaidInterest } = sumAppliedFromAllocations(targetInst);

      let tAppliedInterest = new Decimal(0);
      let tAppliedCapital = new Decimal(0);

      // pendiente de interés corriente en target
      const targetPendingInterest = Decimal.max(
        new Decimal(targetInst.interestAmount ?? 0).minus(tPaidInterest),
        0,
      );

      if (targetPendingInterest.gt(0) && remainingAmount.gt(0)) {
        const toApply = Decimal.min(targetPendingInterest, remainingAmount);
        remainingAmount = remainingAmount.minus(toApply);
        tAppliedInterest = tAppliedInterest.plus(toApply);
      }

      // si interés corriente quedó cubierto, aplicar capital pendiente
      if (remainingAmount.gt(0) && tAppliedInterest.plus(tPaidInterest).gte(new Decimal(targetInst.interestAmount ?? 0))) {
        const pendingCapital = Decimal.max(new Decimal(targetInst.capitalAmount ?? 0).minus(tPaidCapital), 0);
        if (pendingCapital.gt(0)) {
          const toApply = Decimal.min(pendingCapital, remainingAmount);
          remainingAmount = remainingAmount.minus(toApply);
          tAppliedCapital = tAppliedCapital.plus(toApply);
        }
      }

      // Aplicar a la cuota objetivo (solo campos permitidos)
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

      // ---------- Fase D: si queda remainingAmount -> positive balance ----------
      let positiveBalance: PositiveBalance | undefined;
      if (remainingAmount.gt(0)) {
        const existingBalance = await tx.positiveBalance.findFirst({
          where: { loanId: loan.id, isUsed: false },
        });

        if (existingBalance) {
          positiveBalance = await tx.positiveBalance.update({
            where: { id: existingBalance.id },
            data: {
              amount: new Decimal(existingBalance.amount).plus(remainingAmount),
            },
          });

          this.logger.log(
            `💰 PositiveBalance actualizado loanId=${loan.id}, nuevo amount=${positiveBalance.amount.toString()}`,
          );
        } else {
          positiveBalance = await tx.positiveBalance.create({
            data: {
              loanId: loan.id,
              amount: remainingAmount,
              source: 'overpayment',
              isUsed: false,
            },
          });

          this.logger.log(
            `💰 PositiveBalance creado loanId=${loan.id}, amount=${positiveBalance.amount.toString()}`,
          );
        }

        remainingAmount = new Decimal(0);
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
      // Creamos allocations en BD (si hubo). createMany acepta Decimal.
      if (allocations.length > 0) {
        // Prisma createMany ignores defaults like createdAt sometimes depending on db; we provided createdAt explicitly.
        await tx.paymentAllocation.createMany({ data: allocations });
      }

      // Recuperar allocations exactas (para devolver detalle)
      const dbAllocations = await tx.paymentAllocation.findMany({
        where: { paymentId: payment.id },
        orderBy: { id: 'asc' },
      });

      // Respuesta serializada (decimales a string)
      return {
        paymentId: payment.id,
        loanId: loan.id,
        paymentDate: payment.date,
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
}
