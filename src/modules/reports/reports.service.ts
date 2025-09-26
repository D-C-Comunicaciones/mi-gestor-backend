import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { DateRangeDto } from '@common/dto';
import { InterestReportPaginationDto } from './dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) { }

  async getLoanValuesSummary(dto: DateRangeDto) {
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

  /**
   * Obtiene los totales de Intereses RECAUDADOS y PENDIENTES, desglosados por concepto.
   * La paginación se ignora, ya que el reporte es de totales.
   */
  async getLoanInterestSummary(dto: InterestReportPaginationDto): Promise<any> {
    // Usamos el DTO de paginación para heredar startDate/endDate, pero ignoramos page/limit
    let { startDate, endDate, loanStatusName } = dto; 
    
    // 1. Configuración de Fechas por defecto (Últimos 30 días)
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

    // 2. Filtros de Estado para Loans
    const loanStatusFilter: Prisma.LoanStatusWhereInput = {
        name: {
            not: 'Cancelled', // Excluir 'Cancelled'
            in: loanStatusName ? [loanStatusName] : undefined, // Filtro opcional
        }
    };
    const installmentPendingStatuses = ['Overdue', 'Created']; 

    // --- PARTE A: RECAUDADO (Collected) - Cálculo de Totales y Detalle Plano ---

    // Consulta de las asignaciones de pago que generaron interés en el rango de fechas
    const collectedAllocationsRaw = await this.prisma.paymentAllocation.findMany({
        where: {
            payment: {
                date: { gte: start, lte: end }, // Filtro por fecha de pago
            },
            OR: [ { appliedToInterest: { gt: 0 } }, { appliedToLateFee: { gt: 0 } } ],
            installment: {
                isPaid: true, // Solo cuotas marcadas como pagadas
                loan: {
                    isActive: true, // Loan activo
                    loanStatus: loanStatusFilter,
                },
            },
        },
        select: {
            appliedToInterest: true, appliedToLateFee: true, 
            payment: {
                select: {
                    date: true,
                    recordedByUser: {
                        select: { name: true, collector: { select: { firstName: true, lastName: true } } }
                    }
                }
            },
            installment: {
                select: {
                    loan: {
                        select: { id: true, loanStatus: { select: { name: true } }, customer: { select: { firstName: true, lastName: true } } }
                    }
                }
            }
        },
        orderBy: { payment: { date: 'desc' } }, 
    });

    if (collectedAllocationsRaw.length === 0) {
        // En este reporte simplificado, permitimos que devuelva 0 si no hay ingresos en el periodo.
        // throw new NotFoundException(`No se encontraron pagos de intereses que cumplan con los criterios en el rango de fechas proporcionado.`);
    }

    // Cálculo de Totales Recaudados y Detalle Plano
    let totalInterestRecaudado = 0;
    let totalMoratorioRecaudado = 0;

    const collectedDetails = collectedAllocationsRaw.map(alloc => {
        const loan = alloc.installment.loan;
        const customer = loan.customer;
        const collector = alloc.payment.recordedByUser.collector;
        
        const interest = alloc.appliedToInterest?.toNumber() || 0;
        const lateFee = alloc.appliedToLateFee?.toNumber() || 0;
        const totalPaid = interest + lateFee;

        totalInterestRecaudado += interest;
        totalMoratorioRecaudado += lateFee;

        return {
            paymentDate: format(alloc.payment.date, 'yyyy-MM-dd HH:mm:ss'),
            appliedToInterest: interest, // Interés Corriente
            appliedToLateFee: lateFee,  // Interés Moratorio
            totalPaid: totalPaid,
            
            loanId: loan.id,
            loanStatusName: loan.loanStatus.name,
            customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
            collectorName: collector ? `${collector.firstName} ${collector.lastName}` : alloc.payment.recordedByUser.name,
        };
    });
    
    // --- PARTE B: PENDIENTE (Pending) - Total Global ---
    
    // Consulta los intereses pendientes de cuotas vencidas/creadas
    const pendingInstallments = await this.prisma.installment.findMany({
        where: {
            isPaid: false,
            dueDate: { lte: new Date() }, // Solo cuotas vencidas/creadas
            status: { name: { in: installmentPendingStatuses } },
            loan: { isActive: true, loanStatus: loanStatusFilter },
        },
        select: {
            interestAmount: true, // Interés Normal de la cuota
            moratoryInterests: {
                select: { amount: true } // Interés Moratorio acumulado
            },
        }
    });

    let totalInterestPendiente = 0;
    let totalMoratorioPendiente = 0;
    
    pendingInstallments.forEach(inst => {
        totalInterestPendiente += inst.interestAmount?.toNumber() || 0; 
        
        if (inst.moratoryInterests && inst.moratoryInterests.length > 0) {
             inst.moratoryInterests.forEach(mora => {
                 totalMoratorioPendiente += mora.amount || 0; 
             });
        }
    });

    // 3. Retornar el reporte final
    return {
        // Totales Recaudados (Periodo)
        totalInterestRecaudado: totalInterestRecaudado,
        totalMoratorioRecaudado: totalMoratorioRecaudado,
        totalGeneralRecaudado: totalInterestRecaudado + totalMoratorioRecaudado,
        
        // Totales Pendientes (Global)
        totalInterestPendiente: totalInterestPendiente,
        totalMoratorioPendiente: totalMoratorioPendiente,
        // En este reporte simplificado, la "deuda pendiente" es la suma de intereses/mora pendientes.
        totalGeneralPendiente: totalInterestPendiente + totalMoratorioPendiente, 

        // Detalle de los recaudos (plano, para tabla de exportación)
        details: collectedDetails,
        
        // Metadata (vacía, ya que no hay paginación y la cuenta total es compleja)
        meta: { total: collectedDetails.length, page: 1, limit: 99999999, lastPage: 1 } 
    }
  }
}