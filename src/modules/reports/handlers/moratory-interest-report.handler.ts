import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ReportHandler } from './base-report.handler';
import { DateRangeDto } from '@common/dto';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

interface MoratoryInterestRow {
  installmentId: number;
  status: string;
  moratoryGenerated: number;
  moratoryCollected: number;
  moratoryDiscounted: number;
  moratoryRemaining: number;
  discountDescriptions: string[];
  createdAt: string;
}

interface MoratoryInterestGrouped {
  status: string;
  records: MoratoryInterestRow[];
  totalGenerated: number;
  totalCollected: number;
  totalDiscounted: number;
  totalRemaining: number;
}

export interface MoratoryInterestReport {
  generatedAt: string;
  startDate: string;
  endDate: string;
  data: MoratoryInterestGrouped[];
  summary: {
    totalGenerated: number;
    totalCollected: number;
    totalDiscounted: number;
    totalRemaining: number;
  };
}

@Injectable()
export class MoratoryInterestReportHandler
  implements ReportHandler<DateRangeDto, MoratoryInterestReport> {
  private readonly logger = new Logger(MoratoryInterestReportHandler.name);

  constructor(private readonly prisma: PrismaService) { }

  getName(): string {
    return 'moratory-interests-report';
  }

  async execute(dto: DateRangeDto): Promise<MoratoryInterestReport> {
    this.logger.log('📊 Generando reporte detallado de intereses moratorios...');

    const startDate = dto.startDate
      ? startOfDay(new Date(dto.startDate))
      : subDays(new Date(), 30);
    const endDate = dto.endDate
      ? endOfDay(new Date(dto.endDate))
      : new Date();

    // 🔍 Consultar todos los intereses dentro del rango
    const moratories = await this.prisma.moratoryInterest.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        moratoryInterestStatus: true,
        discounts: true,
      },
    });

    const groupedByStatus = new Map<string, MoratoryInterestGrouped>();

    for (const mi of moratories) {
      const rawStatus = mi.moratoryInterestStatus?.name ?? 'unknown';
      const status = this.translateStatus(rawStatus);
      const discounts = mi.discounts ?? [];

      const totalDiscounted = discounts.reduce(
        (acc, d) => acc + safeNumber(d.amount),
        0,
      );

      const moratoryRemaining =
        rawStatus === 'Partially Discounted'
          ? Math.max(0, safeNumber(mi.amount) - totalDiscounted)
          : rawStatus === 'discounted'
            ? 0
            : rawStatus === 'paid'
              ? 0
              : rawStatus === 'partially paid'
                ? Math.max(0, safeNumber(mi.amount) - safeNumber(mi.paidAmount))
                : safeNumber(mi.amount);

      const record: MoratoryInterestRow = {
        installmentId: mi.installmentId,
        status,
        moratoryGenerated: safeNumber(mi.amount),
        moratoryCollected: safeNumber(mi.paidAmount),
        moratoryDiscounted: totalDiscounted,
        moratoryRemaining,
        discountDescriptions: discounts.map((d) => d.description ?? ''),
        createdAt: format(mi.createdAt, 'yyyy-MM-dd'), // ✅ Fechas sin hora
      };

      let group = groupedByStatus.get(status);
      if (!group) {
        group = {
          status,
          records: [],
          totalGenerated: 0,
          totalCollected: 0,
          totalDiscounted: 0,
          totalRemaining: 0,
        };
        groupedByStatus.set(status, group);
      }

      group.records.push(record);

      group.totalGenerated += record.moratoryGenerated;
      group.totalCollected += record.moratoryCollected;
      group.totalDiscounted += record.moratoryDiscounted;
      group.totalRemaining += record.moratoryRemaining;
    }

    // 🧾 Generar resumen general
    const summary = Array.from(groupedByStatus.values()).reduce(
      (acc, g) => ({
        totalGenerated: acc.totalGenerated + g.totalGenerated,
        totalCollected: acc.totalCollected + g.totalCollected,
        totalDiscounted: acc.totalDiscounted + g.totalDiscounted,
        totalRemaining: acc.totalRemaining + g.totalRemaining,
      }),
      {
        totalGenerated: 0,
        totalCollected: 0,
        totalDiscounted: 0,
        totalRemaining: 0,
      },
    );

    // Si no hay registros -> mantener uniformidad con otros handlers: lanzar HttpException con status 200
    if (groupedByStatus.size === 0 || (summary.totalGenerated === 0 && summary.totalCollected === 0 && summary.totalDiscounted === 0 && summary.totalRemaining === 0)) {
      throw new HttpException(
        {
          statusCode: 200,
          message: 'No se encontraron datos para exportar para el reporte "moratory-interests-report" en el período especificado',
        },
        HttpStatus.OK,
      );
    }

    return {
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), // ✅ Fecha con hora
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      data: Array.from(groupedByStatus.values()),
      summary,
    };
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      paid: 'Pagado',
      unpaid: 'No pagado',
      'partially paid': 'Parcialmente pagado',
      Discounted: 'Descontado',
      'Partially Discounted': 'Parcialmente descontado',
      unknown: 'Desconocido',
    };

    return translations[status] ?? status;
  }
}

function safeNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}
