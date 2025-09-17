import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { DateRangeDto } from '@common/dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) { }

  async getLoanValuesSummary(dto: DateRangeDto){
    let { startDate, endDate } = dto;

    if (!startDate || !endDate) {
      const now = new Date();
      startDate = startOfDay(subDays(now, 30)).toISOString();
      endDate = endOfDay(now).toISOString();
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }

    // Obtener los IDs de los estados
    const [upToDateStatus, refinancedStatus, cancelledStatus] = await Promise.all([
      this.prisma.loanStatus.findUnique({ where: { name: 'Up to Date' } }),
      this.prisma.loanStatus.findUnique({ where: { name: 'Refinanced' } }),
      this.prisma.loanStatus.findUnique({ where: { name: 'Cancelled' } }),
    ]);

    if (!upToDateStatus || !refinancedStatus || !cancelledStatus) {
      throw new BadRequestException('No se encontraron los estados de préstamo necesarios.');
    }

    const newLoansWhere: Prisma.LoanWhereInput = {
      startDate: {
        gte: start,
        lte: end,
      },
      loanStatusId: {
        notIn: [refinancedStatus.id, cancelledStatus.id],
      },
    };

    // 1. Consultas para créditos nuevos (no cancelados ni refinanciados)
    const [newLoansTotal, numberOfNewLoans, newLoansDetails] = await Promise.all([
      this.prisma.loan.aggregate({
        _sum: { loanAmount: true },
        where: newLoansWhere,
      }),
      this.prisma.loan.count({ where: newLoansWhere }),
      this.prisma.loan.findMany({
        where: newLoansWhere,
        select: {
          id: true,
          loanAmount: true,
          startDate: true,
          // ✅ Corrección: Seleccionar el valor de la tasa
          interestRate: { select: { value: true } }, 
          penaltyRate: { select: { value: true } },
          loanType: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true, documentNumber: true, address: true, phone: true } },
          loanStatus: { select: { name: true } },
        }
      }),
    ]);

    // 2. Consultas para créditos refinanciados
    const refinancedLoansWhere: Prisma.LoanWhereInput = {
      startDate: {
        gte: start,
        lte: end,
      },
      loanStatusId: refinancedStatus.id,
    };

    const [refinancedLoansTotal, numberOfRefinancedLoans, refinancedLoansDetails] = await Promise.all([
      this.prisma.loan.aggregate({
        _sum: { loanAmount: true },
        where: refinancedLoansWhere,
      }),
      this.prisma.loan.count({ where: refinancedLoansWhere }),
      this.prisma.loan.findMany({
        where: refinancedLoansWhere,
        select: {
          id: true,
          loanAmount: true,
          startDate: true,
          // ✅ Corrección: Seleccionar el valor de la tasa
          interestRate: { select: { value: true } },
          penaltyRate: { select: { value: true } },
          loanType: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true, documentNumber: true, address: true, phone: true } },
          loanStatus: { select: { name: true } },
        }
      }),
    ]);

    const newLoansTotalAmount = newLoansTotal._sum.loanAmount?.toNumber() || 0;
    const refinancedLoansTotalAmount = refinancedLoansTotal._sum.loanAmount?.toNumber() || 0;

    if (newLoansTotalAmount === 0 && refinancedLoansTotalAmount === 0) {
      throw new NotFoundException(`No se encontraron datos de préstamos en el rango de fechas proporcionado.`);
    }

    // 3. Mapeo final con conversiones seguras
    const mapLoanDetails = (loan: any) => ({
      id: loan.id,
      // ✅ Conversión de Decimal a number, asumiendo loanAmount es no-nulo.
      loanAmount: loan.loanAmount.toNumber(), 
      startDate: format(loan.startDate, 'yyyy-MM-dd'),
      // ✅ Conversión segura de Decimal de la relación
      interestRateValue: loan.interestRate?.value?.toNumber() || 0,
      penaltyRateValue: loan.penaltyRate?.value?.toNumber() ?? null,
      creditTypeName: loan.loanType?.name || '',
      customerName: `${loan.customer?.firstName || ''} ${loan.customer?.lastName || ''}`,
      customerDocument: loan.customer?.documentNumber || '',
      customerAddress: loan.customer?.address || '',
      customerPhone: loan.customer?.phone || '',
      loanStatusName: loan.loanStatus.name,
    });

    return {
      numberOfNewLoans,
      newLoansTotalAmount,
      newLoansDetails: newLoansDetails.map(mapLoanDetails),
      numberOfRefinancedLoans,
      refinancedLoansTotalAmount,
      refinancedLoansDetails: refinancedLoansDetails.map(mapLoanDetails),
    }
  }
}