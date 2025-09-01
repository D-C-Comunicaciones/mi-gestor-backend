import { envs } from "@config/envs";
import { PrismaService } from "@infraestructure/prisma/prisma.service";
import { RabbitMqService } from "@infraestructure/rabbitmq/rabbitmq.service";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { addDays, addMonths, addWeeks, addMinutes } from "date-fns";

@Injectable()
export class InstallmentsService {
  private readonly logger = new Logger(InstallmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) { }

  /** Crear primera cuota de un préstamo y publicar mensaje inicial */
  async createFirstInstallment(
    tx: Prisma.TransactionClient,
    loan: any,
    options: { termValue?: number | null; gracePeriod?: number | null }
  ) {
    if (!loan) throw new BadRequestException("Loan no encontrado");

    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const firstDueDate = incrementer(new Date(loan.startDate));

    let installment;
    let remainingInstallments: number | null = null;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!options.termValue) throw new BadRequestException("TermValue requerido para crédito fixed_fees");
        remainingInstallments = options.termValue;
        installment = await this.calculateAndCreateInstallment(
          loan,
          1,
          firstDueDate,
          options.termValue,
          tx
        );
        break;

      case "only_interests":
        if (!options.gracePeriod) throw new BadRequestException("GracePeriod requerido para crédito only_interests");
        remainingInstallments = null; // indefinido
        installment = await this.calculateAndCreateInstallment(
          loan,
          1,
          firstDueDate,
          options.gracePeriod,
          tx
        );
        break;

      default:
        throw new BadRequestException(`Tipo de crédito no soportado: ${loan.loanType.name}`);
    }

    // 🔹 Publicar mensaje inicial en RabbitMQ para la cuota
    const delay = this.calculateNextDelay(loan.paymentFrequency.name);
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanInstallmentsQueue,
      { loanId: loan.id, remainingInstallments },
      delay
    );
    this.logger.log(`📨 Primer mensaje enviado a la cola de cuotas para loanId=${loan.id}, delay=${delay}ms`);

    // 🔹 Publicar mensaje inicial para el monitoreo de interés moratorio con 1 minuto de delay
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanOverdueQueue,
      { loanId: loan.id },
      60 * 1000 // 1 minuto
    );
    this.logger.log(`⏱️ Primer mensaje enviado a la cola de interés moratorio para loanId=${loan.id}, delay=1min`);

    return installment;
  }

  /** Crear siguiente cuota de un préstamo (sin republicar) */
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
    if (!loan.installments || loan.installments.length === 0) throw new BadRequestException("No hay cuotas previas");

    const lastInstallment = loan.installments.reduce((a, b) => a.sequence > b.sequence ? a : b);
    const nextSequence = lastInstallment.sequence + 1;
    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const nextDueDate = incrementer(new Date(lastInstallment.dueDate));

    let installment: any;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!loan.term?.value) throw new BadRequestException("El préstamo no tiene término configurado");
        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.term.value,
          this.prisma
        );
        break;

      // Caso only_interests
      case "only_interests":
        if (!loan.gracePeriod?.days) throw new BadRequestException("El préstamo no tiene período de gracia configurado");

        // Crear la siguiente cuota
        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.gracePeriod.days / 30,
          this.prisma
        );

        // 🔹 Determinar si el período de gracia terminó
        const firstInstallmentDate = new Date(loan.installments[0].dueDate);
        const graceEndDate = new Date(firstInstallmentDate);
        graceEndDate.setDate(graceEndDate.getDate() + loan.gracePeriod.days);

        // Si la fecha de la próxima cuota ya está después del final del período de gracia
        const requiresCapitalPayment = new Date(nextDueDate) > graceEndDate;

        // 🔹 Actualizar el préstamo
        await this.prisma.loan.update({
          where: { id: loanId },
          data: { requiresCapitalPayment }, // <--- Aquí se aplica true si terminó el período de gracia
        });
        break;

      default:
        throw new BadRequestException(`Tipo de crédito no soportado: ${loan.loanType.name}`);
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
    if (!termOrGrace || termOrGrace <= 0) throw new BadRequestException("El número de cuotas o período de gracia no es válido");

    const loanAmountDecimal = new Prisma.Decimal(loan.loanAmount);
    const interestRateValue = new Prisma.Decimal(loan.interestRate.value);
    const interestRateNormalized = interestRateValue.greaterThan(1) ? interestRateValue.div(100) : interestRateValue;

    let capitalAmount = new Prisma.Decimal(0);
    let interestAmount = new Prisma.Decimal(0);
    let totalAmount = new Prisma.Decimal(0);

    const installments = loan.installments ?? [];

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees": {
        const paidCapital = installments.reduce((sum: Prisma.Decimal, installment: any) => {
          return sum.add(new Prisma.Decimal(installment.capitalAmount || 0));
        }, new Prisma.Decimal(0));

        const remainingBalance = loanAmountDecimal.minus(paidCapital);
        const remainingInstallments = termOrGrace - (sequence - 1);
        if (remainingInstallments <= 0) throw new BadRequestException("No hay más cuotas por calcular");

        const monthlyRate = interestRateNormalized;
        const temp = monthlyRate.plus(1).pow(remainingInstallments);
        const factor = monthlyRate.times(temp).div(temp.minus(1));

        const fixedPayment = remainingBalance.times(factor);

        interestAmount = remainingBalance.times(monthlyRate);
        capitalAmount = fixedPayment.minus(interestAmount);
        totalAmount = fixedPayment;

        if (sequence === termOrGrace) {
          capitalAmount = remainingBalance;
          totalAmount = capitalAmount.plus(interestAmount);
        }
        break;
      }

      case "only_interests": {
        interestAmount = loanAmountDecimal.times(interestRateNormalized);
        capitalAmount = new Prisma.Decimal(0);
        totalAmount = interestAmount;
        break;
      }

      default:
        throw new BadRequestException(`Tipo de crédito no soportado: ${loan.loanType.name}`);
    }

    const client = tx ?? this.prisma;

    const installment = await client.installment.create({
      data: {
        sequence,
        dueDate,
        capitalAmount: capitalAmount.toNumber(),
        interestAmount: interestAmount.toNumber(),
        totalAmount: totalAmount.toNumber(),
        paidAmount: 0,
        isPaid: false,
        isActive: true,
        paidAt: null,
        loan: { connect: { id: loan.id } },
        status: { connect: { id: 4 } },
      },
      include: { status: true },
    });

    return installment;
  }

  /** ⏱️ Incrementador de fechas según frecuencia */
  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();
    if (freq.includes("DAILY")) return (date) => addDays(date, 1);
    if (freq.includes("WEEKLY")) return (date) => addWeeks(date, 1);
    if (freq.includes("BIWEEKLY")) return (date) => addDays(date, 15);
    if (freq.includes("MONTHLY")) return (date) => addMonths(date, 1);
    if (freq.includes("MINUTE")) return (date) => addMinutes(date, 1);
    return (date) => addMonths(date, 1); // fallback
  }

  /** Calcula delay para RabbitMQ */
  private calculateNextDelay(paymentFrequency: string): number {
    const freq = paymentFrequency.toUpperCase();
    const delays: Record<string, number> = {
      'MINUTO': 60 * 1000,
      'MINUTE': 60 * 1000,
      'HORA': 60 * 60 * 1000,
      'HOURLY': 60 * 60 * 1000,
      'DIARIA': 24 * 60 * 60 * 1000,
      'DAILY': 24 * 60 * 60 * 1000,
      'SEMANAL': 7 * 24 * 60 * 60 * 1000,
      'WEEKLY': 7 * 24 * 60 * 60 * 1000,
      'QUINCENAL': 15 * 24 * 60 * 60 * 1000,
      'BIWEEKLY': 15 * 24 * 60 * 60 * 1000,
      'MENSUAL': 30 * 24 * 60 * 60 * 1000,
      'MONTHLY': 30 * 24 * 60 * 60 * 1000,
      'ANUAL': 365 * 24 * 60 * 60 * 1000,
      'YEARLY': 365 * 24 * 60 * 60 * 1000,
    };

    for (const key in delays) {
      if (freq.includes(key)) return delays[key];
    }

    this.logger.warn(`⚠️ Frecuencia desconocida "${paymentFrequency}", usando fallback 10s`);
    return 10 * 1000;
  }
}
