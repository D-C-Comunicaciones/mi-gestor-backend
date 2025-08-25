import { PrismaService } from "@infraestructure/prisma/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { addDays, addMonths, addWeeks } from "date-fns";

@Injectable()
export class InstallmentsService {
  constructor(private readonly prisma: PrismaService) { }

  /** Crear primera cuota para un préstamo */
  async createFirstInstallment(
    tx: Prisma.TransactionClient,
    loanId: number,
    startDate: Date,
    termValue: number
  ) {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { interestRate: true, paymentFrequency: true },
    });

    if (!loan) {
      throw new BadRequestException('Loan no encontrado');
    }

    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const firstDueDate = incrementer(startDate);

    const installment = await this.calculateAndCreateInstallment(
      loan,
      1,
      firstDueDate,
      termValue,
      tx // 👈 pasar también la transacción para mantener consistencia
    );

    return installment;
  }

  /** Crear siguiente cuota para un préstamo, según última cuota */
  async createNextInstallment(loanId: number) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { installments: true, interestRate: true, paymentFrequency: true }
    });
    if (!loan) throw new BadRequestException('Loan no encontrado');
    if (!loan.installments || loan.installments.length === 0) throw new BadRequestException('No hay cuotas previas');

    const lastInstallment = loan.installments.reduce((a, b) => (a.sequence > b.sequence ? a : b));
    const nextSequence = lastInstallment.sequence + 1;
    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const nextDueDate = incrementer(lastInstallment.dueDate);

    const installment = await this.calculateAndCreateInstallment(
      loan,
      nextSequence,
      nextDueDate,
      loan.installments.length + 1 // o termValue si lo manejas
    );

    // Actualizar nextDueDate en el préstamo
    await this.prisma.loan.update({
      where: { id: loanId },
      data: { nextDueDate }
    });

    return installment;
  }

  private async calculateAndCreateInstallment(
    loan: any,
    sequence: number,
    dueDate: Date,
    termValue: number,
    tx?: Prisma.TransactionClient // opcional
  ) {
    let capitalAmount = 0;
    let interestAmount = 0;
    let totalAmount = 0;

    // Siempre garantizamos que installments sea un array
    const installments = loan.installments ?? [];

    if (loan.loanTypeId === 1) {
      // Amortización estándar: capital sobre el saldo pendiente

      // Convertir loanAmount a Decimal si no lo es ya
      const initialLoanAmount = loan.loanAmount instanceof Prisma.Decimal
        ? loan.loanAmount
        : new Prisma.Decimal(loan.loanAmount);

      // Reducir sumando capitalAmount de cuotas previas (también en Decimal)
      const remainingBalance = installments.reduce(
        (sum: Prisma.Decimal, i: any) => {
          const capital = i.capitalAmount instanceof Prisma.Decimal
            ? i.capitalAmount
            : new Prisma.Decimal(i.capitalAmount);
          return sum.sub(capital);
        },
        initialLoanAmount
      );

      capitalAmount = remainingBalance.div(termValue - (sequence - 1)).toNumber();

      // Convertir interestRate.value a Decimal si no lo es ya
      const interestRateValue = loan.interestRate.value instanceof Prisma.Decimal
        ? loan.interestRate.value
        : new Prisma.Decimal(loan.interestRate.value);

      const interestRateNormalized = interestRateValue.greaterThan(1)
        ? interestRateValue.div(100)
        : interestRateValue;

      interestAmount = remainingBalance.mul(interestRateNormalized).toNumber();

      totalAmount = capitalAmount + interestAmount;

    } else if (loan.loanTypeId === 2) {
      // Solo intereses

      const loanAmountDecimal = loan.loanAmount instanceof Prisma.Decimal
        ? loan.loanAmount
        : new Prisma.Decimal(loan.loanAmount);

      const interestRateValue = loan.interestRate.value instanceof Prisma.Decimal
        ? loan.interestRate.value
        : new Prisma.Decimal(loan.interestRate.value);

      const interestRateNormalized = interestRateValue.greaterThan(1)
        ? interestRateValue.div(100)
        : interestRateValue;

      interestAmount = loanAmountDecimal.mul(interestRateNormalized).toNumber();

      capitalAmount =
        installments.length < (loan.gracePeriod ?? 0)
          ? 0
          : loanAmountDecimal.toNumber();

      totalAmount = capitalAmount + interestAmount;
    }

    // Si me pasan tx uso tx, si no uso this.prisma
    const client = tx ?? this.prisma;

    return client.installment.create({
      data: {
        loanId: loan.id,
        sequence,
        dueDate,
        capitalAmount,
        interestAmount,
        totalAmount,
        paidAmount: 0,
        isPaid: false,
        isActive: true,
        paidAt: null,
      },
    });
  }

  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();
    if (freq.includes('DIARIA') || freq.includes('DAILY')) return (date) => addDays(date, 1);
    if (freq.includes('SEMANAL') || freq.includes('WEEKLY')) return (date) => addWeeks(date, 1);
    if (freq.includes('QUINCENAL') || freq.includes('BIWEEKLY')) return (date) => addDays(date, 15);
    if (freq.includes('MENSUAL') || freq.includes('MONTHLY')) return (date) => addMonths(date, 1);
    return (date) => addMonths(date, 1);
  }
}
