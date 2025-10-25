import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ReportHandler } from './base-report.handler';
import { DateRangeDto } from '@common/dto';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

interface InterestPaymentRecord {
    paymentId: number;
    installmentId: number;
    loanId: number;
    customerId: number;
    customerName: string;
    customerDocument: string;
    collectorId: number;
    collectorName: string;
    paymentDate: string;
    interestCollected: number;
    capitalCollected: number;
    lateFeeCollected: number;
    totalCollected: number;
}

interface CustomerInterestSummary {
    customerId: number;
    customerName: string;
    customerDocument: string;
    totalInterestCollected: number;
    totalCapitalCollected: number;
    totalLateFeeCollected: number;
    totalCollected: number;
    paymentsCount: number;
    records: InterestPaymentRecord[];
}

export interface InterestsReport {
    generatedAt: string;
    startDate: string;
    endDate: string;
    data: CustomerInterestSummary[];
    summary: {
        totalInterestCollected: number;
        totalCapitalCollected: number;
        totalLateFeeCollected: number;
        totalCollected: number;
        totalPayments: number;
        totalCustomers: number;
    };
}

@Injectable()
export class InterestsReportHandler
    implements ReportHandler<DateRangeDto, InterestsReport> {
    private readonly logger = new Logger(InterestsReportHandler.name);

    constructor(private readonly prisma: PrismaService) { }

    getName(): string {
        return 'interests-report';
    }

    async execute(dto: DateRangeDto): Promise<InterestsReport> {
        this.logger.log('📊 Generando reporte de intereses corrientes recaudados...');

        const startDate = dto.startDate
            ? startOfDay(new Date(dto.startDate))
            : subDays(new Date(), 30);
        const endDate = dto.endDate
            ? endOfDay(new Date(dto.endDate))
            : new Date();

        // Obtener IDs de estados Pending y Paid
        const [pendingStatus, paidStatus] = await Promise.all([
            this.prisma.installmentStatus.findFirst({ where: { name: 'Pending' } }),
            this.prisma.installmentStatus.findFirst({ where: { name: 'Paid' } }),
        ]);

        if (!pendingStatus || !paidStatus) {
            throw new HttpException(
                { statusCode: 500, message: 'No se encontraron los estados de cuota requeridos' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const statusIds = [pendingStatus.id, paidStatus.id];

        // ✅ Consultar pagos CON allocations
        const payments = await this.prisma.payment.findMany({
            where: {
                paymentDate: {
                    gte: startDate,
                    lte: endDate,
                },
                allocations: {
                    some: {
                        installment: {
                            statusId: { in: statusIds },
                        },
                    },
                },
            },
            include: {
                allocations: {
                    include: {
                        installment: {
                            include: {
                                loan: {
                                    include: {
                                        customer: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { paymentDate: 'asc' },
        });

        // ✅ Obtener usuarios (para nombre del cobrador) en un Map
        const userIds = [...new Set(payments.map(p => p.recordedByUserId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
        });
        const userMap = new Map(users.map(u => [u.id, u.name]));

        // ✅ Agrupar por cliente, luego por installmentId dentro de cada pago
        const customerMap = new Map<number, CustomerInterestSummary>();

        for (const payment of payments) {
            // ✅ Agrupar allocations por installmentId para este pago
            const installmentAllocations = new Map<number, {
                installment: any;
                totalInterest: number;
                totalCapital: number;
                totalLateFee: number;
            }>();

            for (const allocation of payment.allocations) {
                const installment = allocation.installment;
                if (!installment) continue;

                const installmentId = installment.id;

                if (!installmentAllocations.has(installmentId)) {
                    installmentAllocations.set(installmentId, {
                        installment,
                        totalInterest: 0,
                        totalCapital: 0,
                        totalLateFee: 0,
                    });
                }

                const group = installmentAllocations.get(installmentId)!;
                group.totalInterest += Number(allocation.appliedToInterest ?? 0);
                group.totalCapital += Number(allocation.appliedToCapital ?? 0);
                group.totalLateFee += Number(allocation.appliedToLateFee ?? 0);
            }

            // ✅ Obtener nombre del usuario que registró el pago
            const collectorName = userMap.get(payment.recordedByUserId) ?? 'Usuario Desconocido';

            // ✅ Procesar cada grupo de installment
            for (const [installmentId, group] of installmentAllocations) {
                const { installment, totalInterest, totalCapital, totalLateFee } = group;
                const loan = installment.loan;
                const customer = loan.customer;

                const totalCollected = totalInterest + totalCapital + totalLateFee;

                const record: InterestPaymentRecord = {
                    paymentId: payment.id,
                    installmentId,
                    loanId: loan.id,
                    customerId: customer.id,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerDocument: customer.documentNumber.toString(),
                    collectorId: payment.collectorId ?? 0,
                    collectorName,
                    paymentDate: format(payment.paymentDate, 'yyyy-MM-dd'),
                    interestCollected: totalInterest,
                    capitalCollected: totalCapital,
                    lateFeeCollected: totalLateFee,
                    totalCollected,
                };

                if (!customerMap.has(customer.id)) {
                    customerMap.set(customer.id, {
                        customerId: customer.id,
                        customerName: record.customerName,
                        customerDocument: record.customerDocument,
                        totalInterestCollected: 0,
                        totalCapitalCollected: 0,
                        totalLateFeeCollected: 0,
                        totalCollected: 0,
                        paymentsCount: 0,
                        records: [],
                    });
                }

                const summary = customerMap.get(customer.id)!;
                summary.totalInterestCollected += totalInterest;
                summary.totalCapitalCollected += totalCapital;
                summary.totalLateFeeCollected += totalLateFee;
                summary.totalCollected += totalCollected;
                summary.paymentsCount += 1;
                summary.records.push(record);
            }
        }

        const data = Array.from(customerMap.values());

        // Calcular resumen global
        const summary = data.reduce(
            (acc, customer) => ({
                totalInterestCollected: acc.totalInterestCollected + customer.totalInterestCollected,
                totalCapitalCollected: acc.totalCapitalCollected + customer.totalCapitalCollected,
                totalLateFeeCollected: acc.totalLateFeeCollected + customer.totalLateFeeCollected,
                totalCollected: acc.totalCollected + customer.totalCollected,
                totalPayments: acc.totalPayments + customer.paymentsCount,
                totalCustomers: acc.totalCustomers + 1,
            }),
            {
                totalInterestCollected: 0,
                totalCapitalCollected: 0,
                totalLateFeeCollected: 0,
                totalCollected: 0,
                totalPayments: 0,
                totalCustomers: 0,
            },
        );

        // Si no hay datos, lanzar HttpException con status 200
        if (data.length === 0 || summary.totalCollected === 0) {
            throw new HttpException(
                {
                    statusCode: 200,
                    message: 'No se encontraron datos para exportar para el reporte "interests-report" en el período especificado',
                },
                HttpStatus.OK,
            );
        }

        return {
            generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            data,
            summary,
        };
    }
}
