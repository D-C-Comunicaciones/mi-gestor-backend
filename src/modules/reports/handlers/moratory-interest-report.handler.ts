import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ReportHandler } from './base-report.handler';
import { DateRangeDto } from '@common/dto';
import { endOfDay, startOfDay, subDays, parseISO, format } from 'date-fns';
import { MoratoryInterestDetail } from './interfaces/interests/moratory-interest-detail.interface';
import { MoratoryInterestReport } from './interfaces';

@Injectable()
export class MoratoryInterestReportHandler
  implements ReportHandler<DateRangeDto, MoratoryInterestReport> {

  private readonly logger = new Logger(MoratoryInterestReportHandler.name);

  constructor(private readonly prisma: PrismaService) { }

  getName(): string {
    return 'moratory-interests-report';
  }

  async execute(dto: DateRangeDto): Promise<MoratoryInterestReport> {
    this.logger.log('📊 Generating moratory interest report (detailed and totals)...');

    // Aceptar startDate/endDate en formato YYYY-MM-DD (inclusive whole day).
    const isYMD = (s: any) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

    let startDate: Date;
    let endDate: Date;
    if (dto && isYMD(dto.startDate) && isYMD(dto.endDate)) {
      try {
        startDate = startOfDay(parseISO(dto.startDate as string));
        endDate = endOfDay(parseISO(dto.endDate as string));
      } catch (err) {
        this.logger.warn('Fechas recibidas inválidas, usando últimos 30 días');
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
      }
    } else if (dto && isYMD(dto.startDate) && !dto.endDate) {
      try {
        startDate = startOfDay(parseISO(dto.startDate as string));
        endDate = endOfDay(new Date());
      } catch (err) {
        this.logger.warn('startDate inválido, usando últimos 30 días');
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
      }
    } else if (dto && !dto.startDate && isYMD(dto.endDate)) {
      try {
        startDate = startOfDay(subDays(parseISO(dto.endDate as string), 30));
        endDate = endOfDay(parseISO(dto.endDate as string));
      } catch (err) {
        this.logger.warn('endDate inválido, usando últimos 30 días');
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
      }
    } else {
      startDate = startOfDay(subDays(new Date(), 30));
      endDate = endOfDay(new Date());
    }

    // Orden y estados canonicos
    const ALL_STATUSES = [
      'Paid',
      'Partially Paid',
      'Unpaid',
      'Partially Discounted',
      'Discounted',
    ];

    const normalizeStatus = (raw: any): string => {
      if (raw === null || raw === undefined) return 'Unpaid';
      const s = String(raw).trim().toLowerCase();
      if (s.includes('partially') && s.includes('discount')) return 'Partially Discounted';
      if (s.includes('partially') && s.includes('paid')) return 'Partially Paid';
      if (s.includes('paid') && !s.includes('part')) return 'Paid';
      if (s.includes('unpaid')) return 'Unpaid';
      if (s.includes('discount')) return 'Discounted';
      return String(raw).replace(/^\w/, c => c.toUpperCase());
    };

    // Helper seguro para convertir Decimal/string/number a number
    const toNumberSafe = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') return v;
      // Decimal.js (Prisma) tiene toNumber o toFixed/toString
      if (typeof v.toNumber === 'function') {
        try { return v.toNumber(); } catch { /* fallthrough */ }
      }
      const s = String(v);
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    };

    // 1) Obtener cambios que apunten a MoratoryInterest en el rango, ordenados desc por timestamp.
    // Filtrar por la parte fecha del timestamp (YYYY-MM-DD). Esto asegura que solo se compare la fecha, ignorando la hora.
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // SELECT agrupando por modelId para obtener el timestamp más reciente por moratoryInterest
    // Solo incluir modelId cuya fecha (YYYY-MM-DD) del timestamp esté entre startDateStr y endDateStr.
    const changes: Array<{ modelId: number; latest_ts: string }> = await this.prisma.$queryRaw`
      SELECT "modelId", MAX("timestamp") AS latest_ts
      FROM changes
      WHERE "model" = 'MoratoryInterest'
        AND "action" = 'update'
        AND to_char("timestamp", 'YYYY-MM-DD') BETWEEN ${startDateStr} AND ${endDateStr}
      GROUP BY "modelId"
      ORDER BY MAX("timestamp") DESC
    ` as any;
 
    // Map con el timestamp más reciente por moratoryId (evita duplicados y nos provee la fecha para el detalle)
    const latestChangeForMoratory = new Map<number, Date>();
    for (const c of changes) {
      const id = Number(c.modelId);
      // la consulta devuelve latest_ts (MAX timestamp) -> convertir a Date
      const ts = c.latest_ts ? new Date(c.latest_ts) : new Date();
      // solo registrar el primero (ya es el más reciente por el GROUP BY + ORDER)
      if (!latestChangeForMoratory.has(id)) {
        latestChangeForMoratory.set(id, ts);
      }
    }
 
    const moratoryIds = Array.from(latestChangeForMoratory.keys());
    if (moratoryIds.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        detailedData: [],
        summary: {
          byStatus: ALL_STATUSES.map(s => ({
            id: 0,
            status: s as any,
            date: '',
            total_generated: 0,
            total_collected: 0,
            total_pending: 0,
            total_discounted: 0,
            total_partially_discounted: 0,
            collected_percentage: 0,
            pending_percentage: 0,
          })),
          totalGenerated: 0,
          totalCollected: 0,
        },
      } as any;
    }

    // 2) Traer moratory interests con select (solo campos necesarios)
    const moratories = await this.prisma.moratoryInterest.findMany({
      where: { id: { in: moratoryIds } },
      select: {
        id: true,
        amount: true,
        paidAmount: true,
        paidAt: true,
        isPaid: true,
        isDiscounted: true,
        moratoryInterestStatus: { select: { id: true, name: true } },
        discounts: { select: { amount: true } },
      },
      orderBy: { id: 'desc' },
    });

    // 3) Mapear detalle y calcular por registro (usar timestamp del cambio si existe)
    const detailedData: MoratoryInterestDetail[] = moratories.map(m => {
      const generated = toNumberSafe(m.amount);
      const collected = toNumberSafe(m.paidAmount);
      const totalDiscounted = (m.discounts || []).reduce((acc, d) => acc + toNumberSafe(d.amount), 0);

      const rawStatus = m.moratoryInterestStatus?.name ?? '';
      const status = normalizeStatus(rawStatus);

      let total_pending = 0;
      const st = status.toLowerCase();
      if (st === 'unpaid') {
        total_pending = generated;
      } else if (st === 'partially paid') {
        total_pending = Math.max(0, generated - collected);
      } else if (st === 'partially discounted') {
        total_pending = Math.max(0, generated - totalDiscounted);
      } else {
        total_pending = 0;
      }

      const collected_percentage = generated ? +(collected * 100 / generated).toFixed(2) : 0;
      const pending_percentage = generated ? +(total_pending * 100 / generated).toFixed(2) : 0;

      // usa timestamp del change si está disponible, sino paidAt, sino vacío
      const changeTs = latestChangeForMoratory.get(m.id);
      const dateIso = changeTs ? changeTs.toISOString() : (m.paidAt ? (m.paidAt as Date).toISOString() : '');

      return {
        id: m.id,
        status,
        date: dateIso,
        total_generated: generated,
        total_collected: collected,
        total_pending,
        total_discounted: st === 'discounted' ? totalDiscounted : 0,
        total_partially_discounted: st === 'partially discounted' ? totalDiscounted : 0,
        collected_percentage,
        pending_percentage,
      } as MoratoryInterestDetail;
    });

    // ------------------------------------------------------------
    // 4) Resumen por estado usando Prisma groupBy + descuentos por estado
    // ------------------------------------------------------------

    // a) Obtener sumas agregadas por estado directamente desde Prisma (optimiza cálculo)
    const grouped = await this.prisma.moratoryInterest.groupBy({
      by: ['moratoryInterestStatusId'],
      where: { id: { in: moratoryIds } },
      _sum: { amount: true, paidAmount: true },
    });

    // b) Mapa idStatus -> nombre (para mostrar estado legible)
    const statusIds = grouped.map(g => g.moratoryInterestStatusId).filter(Boolean) as number[];
    const statuses = await this.prisma.moratoryInterestStatus.findMany({
      where: { id: { in: statusIds } },
      select: { id: true, name: true },
    });
    const statusMap = new Map<number, string>();
    statuses.forEach(s => statusMap.set(s.id, s.name));

    // c) Acumular descuentos por estado (sumar por cada moratory según su estado)
    const discountsByMoratory = new Map<number, number>();
    for (const m of moratories) {
      const sumDisc = (m.discounts || []).reduce((acc, d) => acc + toNumberSafe(d.amount), 0);
      discountsByMoratory.set(m.id, sumDisc);
    }

    const discountsByStatus = new Map<string, number>();
    for (const m of moratories) {
      const rawStatus = m.moratoryInterestStatus?.name ?? '';
      const statusName = normalizeStatus(rawStatus);
      const disc = discountsByMoratory.get(m.id) || 0;
      discountsByStatus.set(statusName, (discountsByStatus.get(statusName) || 0) + disc);
    }

    // d) Construir summary por estado en el orden ALL_STATUSES
    const summaryMap: Record<string, MoratoryInterestDetail> = {};
    ALL_STATUSES.forEach(s => {
      summaryMap[s] = {
        id: 0,
        status: s as any,
        date: '',
        total_generated: 0,
        total_collected: 0,
        total_pending: 0,
        total_discounted: 0,
        total_partially_discounted: 0,
        collected_percentage: 0,
        pending_percentage: 0,
      } as MoratoryInterestDetail;
    });

    // Llenar los totales por estado usando grouped y los descuentos acumulados
    for (const g of grouped) {
      const statusId = g.moratoryInterestStatusId;
      const rawName = statusMap.get(statusId) || '';
      const statusName = normalizeStatus(rawName);

      const total_generated = toNumberSafe(g._sum?.amount);
      const total_collected = toNumberSafe(g._sum?.paidAmount);

      // total_discounted / total_partially_discounted provienen del mapa discountsByStatus
      const total_discounted_for_status = discountsByStatus.get(statusName) || 0;

      // Calcular total_pending según la lógica SQL original
      const sKey = statusName;
      let total_pending = 0;
      if (sKey.toLowerCase() === 'unpaid') {
        total_pending = total_generated;
      } else if (sKey.toLowerCase() === 'partially paid') {
        total_pending = Math.max(0, total_generated - total_collected);
      } else if (sKey.toLowerCase() === 'partially discounted') {
        total_pending = Math.max(0, total_generated - total_discounted_for_status);
      } else if (sKey.toLowerCase() === 'discounted') {
        total_pending = 0;
      } else {
        total_pending = 0;
      }

      const collected_percentage = total_generated ? +(total_collected * 100 / total_generated).toFixed(2) : 0;
      const pending_percentage = total_generated ? +(total_pending * 100 / total_generated).toFixed(2) : 0;

      const agg: MoratoryInterestDetail = {
        id: 0,
        status: sKey as any,
        date: '',
        total_generated,
        total_collected: sKey.toLowerCase() === 'paid' || sKey.toLowerCase() === 'partially paid' ? total_collected : 0,
        total_pending,
        total_discounted: sKey.toLowerCase() === 'discounted' ? total_discounted_for_status : 0,
        total_partially_discounted: sKey.toLowerCase() === 'partially discounted' ? total_discounted_for_status : 0,
        collected_percentage,
        pending_percentage,
      };

      // Sumar al summaryMap (si existe) o crear dinámicamente
      if (summaryMap[agg.status]) {
        const target = summaryMap[agg.status];
        target.total_generated += agg.total_generated;
        target.total_collected += agg.total_collected;
        target.total_pending += agg.total_pending;
        target.total_discounted += agg.total_discounted;
        target.total_partially_discounted += agg.total_partially_discounted;
        // recalcular porcentajes (sobre totales acumulados)
        target.collected_percentage = target.total_generated ? +(target.total_collected * 100 / target.total_generated).toFixed(2) : 0;
        target.pending_percentage = target.total_generated ? +(target.total_pending * 100 / target.total_generated).toFixed(2) : 0;
      } else {
        summaryMap[agg.status] = agg;
      }
    }

    // Asegurar que si hay estados sin filas en grouped siguen apareciendo con ceros (ORDER definido por ALL_STATUSES)
    const byStatus = ALL_STATUSES.map(s => summaryMap[s]);

    const totalGenerated = byStatus.reduce((sum, s) => sum + (s?.total_generated || 0), 0);
    const totalCollected = byStatus.reduce((sum, s) => sum + (s?.total_collected || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      detailedData,
      summary: {
        byStatus,
        totalGenerated,
        totalCollected,
      },
    } as any;
  }
}
