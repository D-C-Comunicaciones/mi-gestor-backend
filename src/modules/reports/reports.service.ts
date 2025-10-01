import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { DateRangeDto } from '@common/dto';
import { InterestReportPaginationDto, ResponseLoanSummaryReportDto } from './dto';
import { ReportsExporterService } from './reports-exporter.service';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reportsExporterService: ReportsExporterService, // Inyectar el exportador
    ) { }

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
                    remainingBalance: true, // ✅ Agregar remainingBalance
                    startDate: true,
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
                    remainingBalance: true, // ✅ Agregar remainingBalance
                    startDate: true,
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
            loanAmount: loan.loanAmount.toNumber(),
            remainingBalance: loan.remainingBalance?.toNumber() || 0, // ✅ Agregar remainingBalance
            startDate: format(loan.startDate, 'yyyy-MM-dd'),
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

        // --- PARTE A: RECAUDADO (Collected) ---

        const collectedAllocationsRaw = await this.prisma.paymentAllocation.findMany({
            where: {
                payment: { paymentDate: { gte: start, lte: end } },
                OR: [{ appliedToInterest: { gt: 0 } }, { appliedToLateFee: { gt: 0 } }],
                installment: {
                    isPaid: true,
                    loan: { isActive: true, loanStatus: loanStatusFilter },
                },
            },
            select: {
                appliedToInterest: true,
                appliedToLateFee: true,
                payment: {
                    select: {
                        id: true,
                        paymentDate: true,
                        recordedByUser: {
                            select: { name: true, collector: { select: { firstName: true, lastName: true } } }
                        }
                    }
                },
                installment: {
                    select: {
                        loan: {
                            select: {
                                id: true,
                                loanStatus: { select: { name: true } },
                                customer: { select: { firstName: true, lastName: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { payment: { paymentDate: 'desc' } },
        });

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
                paymentDate: format(alloc.payment.paymentDate, 'yyyy-MM-dd HH:mm:ss'),
                appliedToInterest: interest,
                appliedToLateFee: lateFee,
                totalPaid: totalPaid,
                loanId: loan.id,
                loanStatusName: loan.loanStatus.name,
                customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
                collectorName: collector ? `${collector.firstName} ${collector.lastName}` : alloc.payment.recordedByUser.name,
            };
        });

        // --- PARTE B: PENDIENTE (Pending) ---

        const pendingInstallments = await this.prisma.installment.findMany({
            where: {
                isPaid: false,
                dueDate: { lte: new Date() },
                status: { name: { in: installmentPendingStatuses } },
                loan: { isActive: true, loanStatus: loanStatusFilter },
            },
            select: {
                interestAmount: true,
                moratoryInterests: { select: { amount: true } }
            }
        });

        let totalInterestPendiente = 0;
        let totalMoratorioPendiente = 0;

        pendingInstallments.forEach(inst => {
            totalInterestPendiente += inst.interestAmount?.toNumber() || 0;

            if (inst.moratoryInterests && inst.moratoryInterests.length > 0) {
                const moraTotal = inst.moratoryInterests.reduce(
                    (sum, mora) => sum + Number(mora.amount || 0),
                    0
                );
                totalMoratorioPendiente += moraTotal;
            }
        });

        // 3. Retornar el reporte final
        return {
            // Totales Recaudados
            totalInterestRecaudado,
            totalMoratorioRecaudado,
            totalGeneralRecaudado: totalInterestRecaudado + totalMoratorioRecaudado,

            // Totales Pendientes
            totalInterestPendiente,
            totalMoratorioPendiente,
            totalGeneralPendiente: totalInterestPendiente + totalMoratorioPendiente,

            // Detalle
            details: collectedDetails,

            meta: { total: collectedDetails.length, page: 1, limit: 99999999, lastPage: 1 }
        }
    }

    /**
     * Obtiene el reporte de recaudos por cobrador con análisis de rendimiento
     * Basado en loan.nextDueDate y comparando asignado vs recaudado por zona
     */
    async getCollectionReport(dto: DateRangeDto): Promise<any> {
        let { startDate, endDate } = dto;

        // Configurar fechas por defecto si no se proporcionan
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
        }

        const start = new Date(startDate + 'T00:00:00.000Z');
        const end = new Date(endDate + 'T23:59:59.999Z');

        try {
            const payments = await this.prisma.payment.findMany({
                where: {
                    paymentDate: { // Usar paymentDate en lugar de date
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    loan: {
                        include: {
                            customer: true,
                            loanStatus: true,
                        },
                    },
                    recordedByUser: {
                        include: {
                            collector: {
                                include: {
                                    typeDocumentIdentification: true,
                                    routes: true, // Incluir rutas asignadas al cobrador
                                },
                            },
                        },
                    },
                    allocations: {
                        include: {
                            installment: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: 'desc', // Usar paymentDate en lugar de date
                },
            });

            // Procesar datos por cobrador
            const collectorMap = new Map();
            const allCollections: Array<{
                paymentId: number;
                paymentDate: string;
                amount: number;
                loanId: number;
                customerId: number;
                installmentId: number | null;
                installmentSequence: number | null;
                customerName: string;
                customerDocument: string;
                loanStatus: string;
                collectorName: string;
                routeNames: string; // Cambiar zoneName por routeNames
            }> = [];

            payments.forEach((payment) => {
                if (payment.recordedByUser.collector) {
                    const collector = payment.recordedByUser.collector;
                    const paymentDate = format(payment.paymentDate, 'yyyy-MM-dd'); // Usar paymentDate

                    const collectorKey = collector.id;

                    if (!collectorMap.has(collectorKey)) {
                        // Obtener nombres de rutas asignadas
                        const routeNames = collector.routes?.map(route => route.name).join(', ') || 'Sin rutas asignadas';

                        collectorMap.set(collectorKey, {
                            collectorId: collector.id,
                            collectorName: `${collector.firstName} ${collector.lastName}`,
                            documentNumber: collector.documentNumber.toString(),
                            routeNames: routeNames, // Cambiar zoneName por routeNames
                            totalAssigned: 0,
                            totalCollected: 0,
                            collectionsCount: 0,
                            performancePercentage: 0,
                            details: [],
                            assignedDetails: [],
                            collectedDetails: [],
                            dailyCollections: [], // Recaudos por día
                            weeklyCollections: [], // Recaudos por semana
                        });
                    }

                    // ...existing code para procesamiento de datos...

                    payment.allocations.forEach(allocation => {
                        const routeNames = collector.routes?.map(route => route.name).join(', ') || 'Sin rutas asignadas';

                        allCollections.push({
                            paymentId: payment.id,
                            paymentDate: format(payment.paymentDate, 'yyyy-MM-dd HH:mm:ss'), // Usar paymentDate
                            amount: Number(payment.amount),
                            loanId: payment.loanId,
                            customerId: payment.loan.customer.id,
                            installmentId: payment.allocations[0]?.installment?.id || null,
                            installmentSequence: payment.allocations[0]?.installment?.sequence || null,
                            customerName: `${payment.loan.customer.firstName} ${payment.loan.customer.lastName}`,
                            customerDocument: payment.loan.customer.documentNumber.toString(),
                            loanStatus: payment.loan.loanStatus.name,
                            collectorName: `${collector.firstName} ${collector.lastName}`,
                            routeNames: routeNames, // Cambiar zoneName por routeNames
                        });
                    });
                }
            });

            // ...existing code para calcular summary...

        } catch (error) {
            this.logger.error(`Error al generar reporte de recaudos: ${error.message}`);
            throw new InternalServerErrorException('Error al generar el reporte de recaudos');
        }
    }

    /**
     * Exporta cualquier reporte en el formato solicitado (xlsx, pdf).
     */
    async exportReport(reportType: string, format: string, queryParams: any): Promise<Buffer> {
        this.logger.log(`Solicitud de exportación para el reporte "${reportType}" en formato "${format}".`);

        let reportData: any;
        try {
            switch (reportType) {
                case 'interest-new-loans':
                case 'interest-summary':
                    reportData = await this.getLoanInterestSummary({ ...queryParams, page: 1, limit: 99999999 });
                    break;
                case 'loans-summary':
                    reportData = await this.getLoanValuesSummary(queryParams);
                    break;
                case 'collections-report':
                    reportData = await this.getCollectionReport(queryParams);
                    break;
                default:
                    throw new BadRequestException(`Tipo de reporte "${reportType}" no soportado para exportación.`);
            }
        } catch (error) {
            this.logger.error(`Error al obtener los datos del reporte: ${error.message}`);
            throw error;
        }

        const isInterestReport = reportType === 'interest-new-loans' || reportType === 'interest-summary';
        const isCollectionReport = reportType === 'collections-report';

        switch (format) {
            case 'xlsx':
                if (isInterestReport) {
                    return this.reportsExporterService.generateInterestReportExcel(reportData);
                } else if (isCollectionReport) {
                    return this.reportsExporterService.generateCollectionReportExcel(reportData);
                } else {
                    return this.reportsExporterService.generateLoansExcel(reportData as ResponseLoanSummaryReportDto);
                }
            case 'pdf':
                if (isInterestReport) {
                    return this.reportsExporterService.generateInterestReportPdf(reportData);
                } else if (isCollectionReport) {
                    return this.reportsExporterService.generateCollectionReportPdf(reportData);
                } else {
                    return this.reportsExporterService.generateLoansPdf(reportData as ResponseLoanSummaryReportDto);
                }
            default:
                throw new BadRequestException(`Formato de exportación "${format}" no soportado.`);
        }
    }
}