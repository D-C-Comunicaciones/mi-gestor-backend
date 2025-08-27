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
    const firstDueDate = incrementer(new Date(loan.startDate));

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
    const nextDueDate = incrementer(new Date(lastInstallment.dueDate));

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

    // Convertir todo a Decimal para precisión
    const loanAmountDecimal = new Prisma.Decimal(loan.loanAmount);
    const interestRateValue = new Prisma.Decimal(loan.interestRate.value);
    const interestRateNormalized = interestRateValue.greaterThan(1)
      ? interestRateValue.div(100)
      : interestRateValue;

    let capitalAmount: Prisma.Decimal = new Prisma.Decimal(0);
    let interestAmount: Prisma.Decimal = new Prisma.Decimal(0);
    let totalAmount: Prisma.Decimal = new Prisma.Decimal(0);

    const installments = loan.installments ?? [];

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees": {
        // Calcular capital pagado hasta ahora
        const paidCapital = installments.reduce((sum: Prisma.Decimal, installment: any) => {
          const installmentCapital = new Prisma.Decimal(installment.capitalAmount || 0);
          return sum.add(installmentCapital);
        }, new Prisma.Decimal(0));

        const remainingBalance = loanAmountDecimal.minus(paidCapital);
        const remainingInstallments = termOrGrace - (sequence - 1);

        if (remainingInstallments <= 0) {
          throw new BadRequestException("No hay más cuotas por calcular");
        }

        // Cálculo de cuota fija (sistema francés)
        const monthlyRate = interestRateNormalized;
        const temp = monthlyRate.plus(1).pow(remainingInstallments);
        const factor = monthlyRate.times(temp).div(temp.minus(1));
        
        const fixedPayment = remainingBalance.times(factor);
        
        interestAmount = remainingBalance.times(monthlyRate);
        capitalAmount = fixedPayment.minus(interestAmount);
        totalAmount = fixedPayment;

        // Ajustar la última cuota para que coincida exactamente
        if (sequence === termOrGrace) {
          capitalAmount = remainingBalance;
          totalAmount = capitalAmount.plus(interestAmount);
        }
        break;
      }

      case "only_interests": {
        // Siempre se cobra solo interés sobre el capital original
        interestAmount = loanAmountDecimal.times(interestRateNormalized);
        capitalAmount = new Prisma.Decimal(0);
        totalAmount = interestAmount;
        break;
      }

      default:
        throw new BadRequestException(`Tipo de crédito no soportado: ${loan.loanType.name}`);
    }

    const client = tx ?? this.prisma;
    return client.installment.create({
      data: {
        loanId: loan.id,
        sequence,
        dueDate,
        capitalAmount: capitalAmount.toNumber(),
        interestAmount: interestAmount.toNumber(),
        totalAmount: totalAmount.toNumber(),
        paidAmount: 0,
        isPaid: false,
        isActive: true,
        paidAt: null,
      },
    });
  }

  /** ⏱️ Incrementador de fechas según frecuencia - CORREGIDO */
  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();

    // Lógica simplificada y consistente
    if (freq.includes("DIARIA") || freq.includes("DAILY")) {
      return (date) => addDays(date, 1);
    }
    if (freq.includes("SEMANAL") || freq.includes("WEEKLY")) {
      return (date) => addWeeks(date, 1);
    }
    if (freq.includes("QUINCENAL") || freq.includes("BIWEEKLY")) {
      return (date) => addDays(date, 15);
    }
    if (freq.includes("MENSUAL") || freq.includes("MONTHLY") || freq.includes("30")) {
      return (date) => addMonths(date, 1);
    }
    if (freq.includes("MINUTO") || freq.includes("MINUTE")) {
      return (date) => addMinutes(date, 1);
    }

    // Fallback: mensual
    return (date) => addMonths(date, 1);
  }
}