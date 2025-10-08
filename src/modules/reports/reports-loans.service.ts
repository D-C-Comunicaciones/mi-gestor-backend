import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DateRangeDto } from '@common/dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { subDays } from 'date-fns/subDays';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns/format';

@Injectable()
export class ReportLoanService {
    private readonly logger = new Logger(ReportLoanService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Traduce los nombres de estados, tipos, etc. del inglés al español
     */
    private translateField(fieldName: string, value: string): string {
        const translations: { [key: string]: { [key: string]: string } } = {
            loanStatus: {
                'Up to Date': 'Al Día',
                'Overdue': 'En Mora',
                'Paid': 'Pagado',
                'Refinanced': 'Refinanciado',
                'Cancelled': 'Cancelado',
                'Created': 'Creado',
                'Pending': 'Pendiente',
                'Outstanding Balance': 'Saldo Pendiente',
            },
            loanType: {
                'fixed_fees': 'Cuotas Fijas',
                'only_interests': 'Interés Mensuales',
                'line_of_credit': 'Línea de Crédito',
            },
            paymentFrequency: {
                'DAILY': 'Diario',
                'WEEKLY': 'Semanal',
                'BIWEEKLY': 'Quincenal',
                'MONTHLY': 'Mensual',
                'MINUTE': 'Minuto',
                'BIMONTHLY': 'Bimestral',
                'QUARTERLY': 'Trimestral',
                'SEMESTERLY': 'Semestral',
                'ANNUALLY': 'Anual',
            },
        };

        return translations[fieldName]?.[value] || value;
    }

    /**
     * Obtiene todos los datos necesarios para el reporte del valor de los créditos y refinanciados
     */
    async getLoansReportData(dto: DateRangeDto) {
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
        const [refinancedStatus, cancelledStatus] = await Promise.all([
            this.prisma.loanStatus.findFirst({ where: { name: { equals: 'Refinanced', mode: 'insensitive' } } }),
            this.prisma.loanStatus.findFirst({ where: { name: { equals: 'Cancelled', mode: 'insensitive' } } }),
        ]);

        if (!refinancedStatus || !cancelledStatus) {
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
                    remainingBalance: true,
                    startDate: true,
                    nextDueDate: true,
                    graceEndDate: true,
                    requiresCapitalPayment: true,
                    interestRate: { select: { id: true, name: true, value: true } },
                    penaltyRate: { select: { id: true, name: true, value: true } },
                    term: { select: { id: true, value: true } },
                    gracePeriod: { select: { id: true, name: true, days: true } },
                    paymentFrequency: { select: { id: true, name: true } },
                    loanType: { select: { id: true, name: true } },
                    loanStatus: { select: { id: true, name: true } },
                    customer: { 
                        select: { 
                            id: true,
                            firstName: true, 
                            lastName: true, 
                            documentNumber: true, 
                            address: true, 
                            phone: true 
                        } 
                    },
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
                    remainingBalance: true,
                    startDate: true,
                    nextDueDate: true,
                    graceEndDate: true,
                    requiresCapitalPayment: true,
                    interestRate: { select: { id: true, name: true, value: true } },
                    penaltyRate: { select: { id: true, name: true, value: true } },
                    term: { select: { id: true, value: true } },
                    gracePeriod: { select: { id: true, name: true, days: true } },
                    paymentFrequency: { select: { id: true, name: true } },
                    loanType: { select: { id: true, name: true } },
                    loanStatus: { select: { id: true, name: true } },
                    customer: { 
                        select: { 
                            id: true,
                            firstName: true, 
                            lastName: true, 
                            documentNumber: true, 
                            address: true, 
                            phone: true 
                        } 
                    },
                }
            }),
        ]);

        const newLoansTotalAmount = newLoansTotal._sum.loanAmount?.toNumber() || 0;
        const refinancedLoansTotalAmount = refinancedLoansTotal._sum.loanAmount?.toNumber() || 0;

        if (newLoansTotalAmount === 0 && refinancedLoansTotalAmount === 0) {
            throw new NotFoundException(`No se encontraron datos de préstamos en el rango de fechas proporcionado.`);
        }

        // 3. Mapeo final con conversiones seguras y traducciones
        const mapLoanDetails = (loan: any) => ({
            id: loan.id,
            loanAmount: loan.loanAmount.toNumber(),
            remainingBalance: loan.remainingBalance?.toNumber() || 0,
            startDate: format(loan.startDate, 'yyyy-MM-dd'),
            nextDueDate: loan.nextDueDate ? format(loan.nextDueDate, 'yyyy-MM-dd') : 'N/A',
            graceEndDate: loan.graceEndDate ? format(loan.graceEndDate, 'yyyy-MM-dd') : 'N/A',
            requiresCapitalPayment: loan.requiresCapitalPayment ? 'Sí' : 'No',
            
            // Tasa de interés
            interestRateId: loan.interestRate?.id || null,
            interestRateName: loan.interestRate?.name || 'N/A',
            interestRateValue: loan.interestRate?.value?.toNumber() || 0,
            
            // Tasa de penalidad
            penaltyRateId: loan.penaltyRate?.id || null,
            penaltyRateName: loan.penaltyRate?.name || 'N/A',
            penaltyRateValue: loan.penaltyRate?.value?.toNumber() || 0,
            
            // Plazo
            termId: loan.term?.id || null,
            termValue: loan.term?.value || 'N/A',
            
            // Período de gracia
            gracePeriodId: loan.gracePeriod?.id || null,
            gracePeriodName: loan.gracePeriod?.name || 'N/A',
            gracePeriodDays: loan.gracePeriod?.days || 0,
            
            // Frecuencia de pago (traducida)
            paymentFrequencyId: loan.paymentFrequency?.id || null,
            paymentFrequencyName: this.translateField('paymentFrequency', loan.paymentFrequency?.name || ''),
            
            // Tipo de crédito (traducido)
            loanTypeId: loan.loanType?.id || null,
            loanTypeName: this.translateField('loanType', loan.loanType?.name || ''),
            creditTypeName: this.translateField('loanType', loan.loanType?.name || ''), // Alias para compatibilidad
            
            // Estado del crédito (traducido)
            loanStatusId: loan.loanStatus?.id || null,
            loanStatusName: this.translateField('loanStatus', loan.loanStatus?.name || ''),
            
            // Cliente
            customerId: loan.customer?.id || null,
            customerName: `${loan.customer?.firstName || ''} ${loan.customer?.lastName || ''}`.trim(),
            customerDocument: loan.customer?.documentNumber || '',
            customerAddress: loan.customer?.address || '',
            customerPhone: loan.customer?.phone || '',
        });

        const totalLoans = numberOfNewLoans + numberOfRefinancedLoans;
        const totalAmount = newLoansTotalAmount + refinancedLoansTotalAmount;
        const averageLoanAmount = totalLoans > 0 ? totalAmount / totalLoans : 0;

        return {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
            numberOfNewLoans,
            newLoansTotalAmount,
            newLoansDetails: newLoansDetails.map(mapLoanDetails),
            numberOfRefinancedLoans,
            refinancedLoansTotalAmount,
            refinancedLoansDetails: refinancedLoansDetails.map(mapLoanDetails),
            summary: {
                numberOfNewLoans,
                newLoansTotalAmount,
                numberOfRefinancedLoans,
                refinancedLoansTotalAmount,
                totalLoans,
                totalAmount,
                averageLoanAmount,
            },
            metadata: {
                totalRecords: totalLoans,
                generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                period: `${format(start, 'yyyy-MM-dd')} al ${format(end, 'yyyy-MM-dd')}`,
            }
        };
    }
}