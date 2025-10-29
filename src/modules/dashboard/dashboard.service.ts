import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { addDays, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardForLast30Days() {
    const now = new Date();
    const start30 = subDays(now, 30);
    const start5 = now;
    const end5 = addDays(now, 5);
    const end30 = now;

    // ----------------------------
    // 1) TOTAL RECAUDADO (últimos 30 días)
    // Sumamos appliedToCapital + appliedToInterest + appliedToLateFee desde payment_allocations
    // ----------------------------
    const allocSums = await this.prisma.paymentAllocation.aggregate({
      _sum: {
        appliedToCapital: true,
        appliedToInterest: true,
        appliedToLateFee: true,
      },
      where: {
        createdAt: { gte: start30, lte: end30 },
      },
    });

    const totalCollected =
      (Number(allocSums._sum.appliedToCapital ?? 0) || 0) +
      (Number(allocSums._sum.appliedToInterest ?? 0) || 0) +
      (Number(allocSums._sum.appliedToLateFee ?? 0) || 0);

    // ----------------------------
    // 2) CLIENTES TOTALES (global)
    // ----------------------------
    const totalCustomers = await this.prisma.customer.count();

    // ----------------------------
    // 3) CLIENTES EN MORA (global, no filtro 30d)
    // contamos customers que tienen al menos un loan cuyo loanStatus.name = 'Overdue'
    // ----------------------------
    const overdueStatus = await this.prisma.loanStatus.findUnique({ where: { name: 'Overdue' } });
    const customersInOverdue =
      overdueStatus
        ? await this.prisma.customer.count({
            where: {
              loans: { some: { loanStatusId: overdueStatus.id } },
            },
          })
        : 0;

    // ----------------------------
    // 4) CUOTAS EN PROGRESO (no filtro 30d)
    // statusId: Pending y Created (según tabla installement_status)
    // asumimos nombres: 'Pending' y 'Created' en InstallmentStatus
    // ----------------------------
    const pendingStatus = await this.prisma.installmentStatus.findUnique({ where: { name: 'Pending' } });
    const createdStatus = await this.prisma.installmentStatus.findUnique({ where: { name: 'Created' } });

    const inProgressStatusIds: number[] = [];
    if (pendingStatus) inProgressStatusIds.push(pendingStatus.id);
    if (createdStatus) inProgressStatusIds.push(createdStatus.id);

    const installmentsInProgressCount = inProgressStatusIds.length
      ? await this.prisma.installment.count({ where: { statusId: { in: inProgressStatusIds } } })
      : 0;

    // Vencen en 30 días: installments with dueDate <= now + 30 days and status in progress
    const dueSoonDate = addDays(now, 30);
    const installmentsDueSoonCount = inProgressStatusIds.length
      ? await this.prisma.installment.count({
          where: {
            statusId: { in: inProgressStatusIds },
            dueDate: { lte: dueSoonDate, gte: now }, // en los próximos 30 días
          },
        })
      : 0;

    // ----------------------------
    // 5) RECAUDO MENSUAL (datos para gráfica) - últimos 30 días
    // agrupamos payment_allocations por día (createdAt) y sumamos las tres columnas
    // ----------------------------
    const allocationsLast30 = await this.prisma.paymentAllocation.findMany({
      where: { createdAt: { gte: start30, lte: end30 } },
      include: { payment: true },
      orderBy: { createdAt: 'asc' },
    });

    // reduce por fecha (YYYY-MM-DD)
    const dailyMap = new Map<string, { date: string; total: number; byCollector?: Record<string, number> }>();
    for (const a of allocationsLast30) {
      const day = format(a.createdAt, 'yyyy-MM-dd');
      const value =
        Number(a.appliedToCapital ?? 0) + Number(a.appliedToInterest ?? 0) + Number(a.appliedToLateFee ?? 0);
      const prev = dailyMap.get(day);
      if (prev) prev.total += value;
      else dailyMap.set(day, { date: day, total: value });
    }
    // Convertir mapa a array ordenado por fecha, y rellenar días sin valores (opcional)
    const dailyArray = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Para una gráfica continua quiero los últimos 30 días con 0s donde no hubo recaudación
    const daysArr: { date: string; total: number }[] = [];
    for (let i = 0; i <= 30; i++) {
      const d = format(addDays(start30, i), 'yyyy-MM-dd');
      const found = dailyArray.find(x => x.date === d);
      daysArr.push({ date: d, total: found ? Number(found.total) : 0 });
    }

    // ----------------------------
    // 6) ESTADO DE CLIENTES (donut): Al día, En mora, Vencimiento próximo (<=5 días)
    // - "Al día": loans whose loanStatus.name = 'Up to Date'  -> contar clientes
    // - "En mora": ya calculado (Overdue)
    // - "Vencimiento próximo": loans with nextDueDate <= now + 5 days and >= now
    // Los contaremos como clientes únicos (distinct customers) usando filtros via customer.count
    // ----------------------------
    const upToDate = await this.prisma.loanStatus.findUnique({ where: { name: 'Up to Date' } });
    const upToDateCustomers = upToDate
      ? await this.prisma.customer.count({ where: { loans: { some: { loanStatusId: upToDate.id } } } })
      : 0;

    const soonDueCustomers = await this.prisma.customer.count({
      where: {
        loans: { some: { nextDueDate: { gte: start5, lte: end5 } } }, // nextDueDate en los próximos 5 días
      },
    });

    const totalForPercent = totalCustomers || 1;
    const clientStatus = {
      upToDate: { count: upToDateCustomers, percent: Math.round((upToDateCustomers / totalForPercent) * 100) },
      overdue: { count: customersInOverdue, percent: Math.round((customersInOverdue / totalForPercent) * 100) },
      dueSoon: { count: soonDueCustomers, percent: Math.round((soonDueCustomers / totalForPercent) * 100) },
    };

    // ----------------------------
    // 7) RENDIMIENTO DE COBRADORES (últimos 30 días)
    // - Para cada collector: número de clientes asignados, total recaudado (sum allocations cuyo payment.collectorId = collector.id)
    // - Añadimos un target por defecto para calcular % (ejemplo: 400000)
    // ----------------------------
    const collectors = await this.prisma.collector.findMany({
      where: { isActive: true },
      include: {
        routes: { include: { customers: true } }, // para contar clientes asignados
      },
    });

    // obtenemos allocations agrupadas por payment.collectorId para los últimos 30 días
    const allocationsWithPayment = await this.prisma.paymentAllocation.findMany({
      where: { createdAt: { gte: start30, lte: end30 } },
      include: { payment: true },
    });

    // mapa collectorId => total
    const collectedByCollector = new Map<number, number>();
    for (const a of allocationsWithPayment) {
      const collectorId = a.payment?.collectorId ?? null;
      const value = Number(a.appliedToCapital ?? 0) + Number(a.appliedToInterest ?? 0) + Number(a.appliedToLateFee ?? 0);
      if (collectorId) {
        collectedByCollector.set(collectorId, (collectedByCollector.get(collectorId) ?? 0) + value);
      }
    }

    // crear array performance
    const DEFAULT_TARGET = 400000; // configurable
    const collectorsPerformance = collectors.map(c => {
      const clientsCount = c.routes.reduce((acc, r) => acc + (r.customers?.length ?? 0), 0);
      const collected = Number(collectedByCollector.get(c.id) ?? 0);
      const percent = DEFAULT_TARGET > 0 ? Math.round((collected / DEFAULT_TARGET) * 100) : 0;
      return {
        collectorId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        clientsCount,
        collected,
        target: DEFAULT_TARGET,
        percent,
      };
    });

    // ----------------------------
    // 8) PAGOS RECIENTES (últimos 30 días) - devolver payment + collector name + customer name + computed status simple
    // - tomamos los últimos N pagos (por paymentDate desc), y para cada uno sumamos allocations para saber monto aplicado
    // ----------------------------
    const paymentsLast30 = await this.prisma.payment.findMany({
      where: { paymentDate: { gte: start30, lte: end30 } },
      include: { allocations: true, collector: true, loan: { include: { customer: true } } },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    const recentPayments = paymentsLast30.map(p => {
      const allocatedSum = (p.allocations ?? []).reduce((acc, a) => {
        return acc + Number(a.appliedToCapital ?? 0) + Number(a.appliedToInterest ?? 0) + Number(a.appliedToLateFee ?? 0);
      }, 0);
      // estado simple: si sum allocations >= payment.amount -> Completed, else Pending
      const status = allocatedSum >= Number(p.amount ?? 0) ? 'Completed' : 'Pending';
      const customer = (p.loan as any)?.customer;
      return {
        paymentId: p.id,
        paymentDate: p.paymentDate.toISOString().split('T')[0],
        amount: Number(p.amount ?? 0),
        appliedAmount: allocatedSum,
        status,
        collector: p.collector ? { id: p.collector.id, firstName: p.collector.firstName, lastName: p.collector.lastName } : null,
        customer: customer ? { id: customer.id, firstName: customer.firstName, lastName: customer.lastName } : null,
      };
    });

    // ----------------------------
    // 9) Resultado final
    // ----------------------------
    return {
      cards: {
        totalCollected: totalCollected, // number
        totalCustomers,
        customersInOverdue,
        installmentsInProgress: installmentsInProgressCount,
        installmentsDueSoon: installmentsDueSoonCount,
      },
      monthlyCollection: {
        startDate: format(start30, 'yyyy-MM-dd'),
        endDate: format(end30, 'yyyy-MM-dd'),
        daily: daysArr, // [{date: '2025-01-01', total: 40000}, ...]
      },
      clientStatus: clientStatus, // upToDate, overdue, dueSoon (counts and percents)
      collectorsPerformance, // array con performance por cobrador
      recentPayments, // últimos 10 pagos (estructura arriba)
    };
  }
}
