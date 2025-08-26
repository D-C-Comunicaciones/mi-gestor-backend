import { PrismaService } from "@infraestructure/prisma/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { addDays, addMonths, addWeeks, addMinutes } from "date-fns";

@Injectable()
export class InstallmentsService {
  constructor(private readonly prisma: PrismaService) { }

  /** Crear primera cuota de un préstamo */
  async createFirstInstallment(
    tx: Prisma.TransactionClient,
    loan: any,
    options: { termValue?: number | null; gracePeriod?: number | null }
  ) {
    if (!loan) throw new BadRequestException("Loan no encontrado");

    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const firstDueDate = incrementer(loan.startDate);

    let installment;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!options.termValue) {
          throw new BadRequestException(
            "TermValue requerido para crédito fixed_fees"
          );
        }
        installment = await this.calculateAndCreateInstallment(
          loan,
          1,
          firstDueDate,
          options.termValue,
          tx
        );
        break;

      case "only_interests":
        if (!options.gracePeriod) {
          throw new BadRequestException(
            "GracePeriod requerido para crédito only_interests"
          );
        }
        installment = await this.calculateAndCreateInstallment(
          loan,
          1,
          firstDueDate,
          options.gracePeriod,
          tx
        );
        break;

      default:
        throw new BadRequestException(
          `Tipo de crédito no soportado: ${loan.loanType.name}`
        );
    }

    return installment;
  }

  /** Crear siguiente cuota de un préstamo */
  async createNextInstallment(loanId: number) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: true,
        interestRate: true,
        paymentFrequency: true,
        loanType: true,
        term: true,
        gracePeriod: true,
      },
    });

    if (!loan) throw new BadRequestException("Loan no encontrado");
    if (!loan.installments || loan.installments.length === 0) {
      throw new BadRequestException("No hay cuotas previas");
    }

    const lastInstallment = loan.installments.reduce((a, b) =>
      a.sequence > b.sequence ? a : b
    );
    const nextSequence = lastInstallment.sequence + 1;
    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const nextDueDate = incrementer(lastInstallment.dueDate);

    let installment;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!loan.term?.value) {
          throw new BadRequestException(
            "El préstamo no tiene término configurado"
          );
        }
        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.term.value,
          this.prisma
        );
        break;

      case "only_interests":
        if (!loan.gracePeriod?.days) {
          throw new BadRequestException(
            "El préstamo no tiene período de gracia configurado"
          );
        }
        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.gracePeriod.days / 30,
          this.prisma
        );
        break;

      default:
        throw new BadRequestException(
          `Tipo de crédito no soportado: ${loan.loanType.name}`
        );
    }

    await this.prisma.loan.update({
      where: { id: loanId },
      data: { nextDueDate },
    });

    return installment;
  }

  /** Cálculo de la cuota según tipo de crédito */
  private async calculateAndCreateInstallment(
    loan: any,
    sequence: number,
    dueDate: Date,
    termOrGrace: number,
    tx?: Prisma.TransactionClient
  ) {
    if (!termOrGrace || termOrGrace <= 0) {
      throw new BadRequestException(
        "El número de cuotas o período de gracia no es válido"
      );
    }

    let capitalAmount = 0;
    let interestAmount = 0;
    let totalAmount = 0;

    const installments = loan.installments ?? [];

    const interestRateValue =
      loan.interestRate.value instanceof Prisma.Decimal
        ? loan.interestRate.value
        : new Prisma.Decimal(loan.interestRate.value);

    const interestRateNormalized = interestRateValue.greaterThan(1)
      ? interestRateValue.div(100)
      : interestRateValue;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees": {
        const initialLoanAmount =
          loan.loanAmount instanceof Prisma.Decimal
            ? loan.loanAmount
            : new Prisma.Decimal(loan.loanAmount);

        const remainingBalance = installments.reduce(
          (sum: Prisma.Decimal, i: any) => {
            const capital =
              i.capitalAmount instanceof Prisma.Decimal
                ? i.capitalAmount
                : new Prisma.Decimal(i.capitalAmount);
            return sum.sub(capital);
          },
          initialLoanAmount
        );

        capitalAmount = remainingBalance
          .div(termOrGrace - (sequence - 1))
          .toNumber();

        interestAmount = remainingBalance
          .mul(interestRateNormalized)
          .toNumber();
        totalAmount = capitalAmount + interestAmount;
        break;
      }

      case "only_interests": {
        const loanAmountDecimal =
          loan.loanAmount instanceof Prisma.Decimal
            ? loan.loanAmount
            : new Prisma.Decimal(loan.loanAmount);

        // siempre se cobra solo interés sobre el capital original
        interestAmount = loanAmountDecimal
          .mul(interestRateNormalized)
          .toNumber();

        capitalAmount = 0; // nunca se factura capital automáticamente
        totalAmount = interestAmount;
        break;
      }
    }

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

  /** ⏱️ Incrementador de fechas según frecuencia */
  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();

    if (freq.includes("DIARIA") || freq.includes("DAILY")) {
      return (date) => addDays(date, 1 - 1); // +1 día, pero 1 día antes
    }
    if (freq.includes("SEMANAL") || freq.includes("WEEKLY")) {
      return (date) => addDays(addWeeks(date, 1), -2); // +1 semana, pero 2 días antes
    }
    if (freq.includes("QUINCENAL") || freq.includes("BIWEEKLY")) {
      return (date) => addDays(date, 15 - 2); // +15 días, pero 2 días antes
    }
    if (freq.includes("MENSUAL") || freq.includes("MONTHLY") || freq.includes("30")) {
      return (date) => addDays(addMonths(date, 1), -2); // +1 mes, pero 2 días antes
    }
    if (freq.includes("MINUTO") || freq.includes("MINUTE")) {
      return (date) => addMinutes(date, 1); // sin anticipación aquí
    }

    // fallback: mensual con 2 días antes
    return (date) => addDays(addMonths(date, 1), -2);
  }

}
