import { envs } from "@config/envs";
import { PrismaService } from "@infraestructure/prisma/prisma.service";
import { RabbitMqService } from "@infraestructure/rabbitmq/rabbitmq.service";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma, Installment } from "@prisma/client";
import { addDays, addMonths, addWeeks, addSeconds } from "date-fns";

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

    this.logger.log(`📌 Calculando primera cuota para loanId=${loan.id}, dueDate=${firstDueDate.toISOString()}`);

    let installment;
    let remainingInstallments: number | null = null;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!options.termValue)
          throw new BadRequestException("TermValue requerido para crédito fixed_fees");

        remainingInstallments = options.termValue - 1;

        installment = await this.calculateAndCreateInstallment(
          loan,
          1,
          firstDueDate,
          options.termValue,
          tx
        );
        break;

      case "only_interests":
        if (!options.gracePeriod)
          throw new BadRequestException("GracePeriod requerido para crédito only_interests");
        remainingInstallments = null;

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

    // 🔹 Programar la creación de la siguiente cuota
    const nextDueDate = incrementer(firstDueDate);
    let createNextDate = this.calculateCreateNextDate(nextDueDate, loan.paymentFrequency.name);

    // Garantizar que createNextDate esté en el futuro
    if (createNextDate <= new Date()) {
      createNextDate = new Date(Date.now() + 50); // mínimo 50ms
    }

    const delay = createNextDate.getTime() - Date.now();

    this.logger.log(`📨 Próxima cuota de loanId=${loan.id} programada para creación: ${createNextDate.toISOString()}, dueDate real: ${nextDueDate.toISOString()}, delay=${delay}ms`);

    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanInstallmentsQueue,
      { loanId: loan.id, remainingInstallments },
      delay
    );

    // 🔹 Publicar mensaje inicial para monitoreo de interés moratorio con 1 min de delay
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanOverdueQueue,
      { loanId: loan.id },
      24 * 60 * 60 * 1000 // 24 horas en milisegundos
    );
    this.logger.log(`⏱️ Primer mensaje de interés moratorio enviado para loanId=${loan.id}, delay=1min`);

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
      this.logger.warn(`⚠️ Loan ${loanId} no tiene cuotas previas`);
      return;
    }

    const lastInstallment = loan.installments.reduce((a, b) =>
      a.sequence > b.sequence ? a : b,
    );
    const nextSequence = lastInstallment.sequence + 1;
    const incrementer = this.getDateIncrementer(loan.paymentFrequency.name);
    const nextDueDate = incrementer(new Date(lastInstallment.dueDate));

    this.logger.log(
      `📌 Calculando siguiente cuota para loanId=${loan.id}, nextSequence=${nextSequence}, nextDueDate=${nextDueDate.toISOString()}`,
    );

    let installment: any;

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees":
        if (!loan.term?.value)
          throw new BadRequestException("El préstamo no tiene término configurado");

        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.term.value,
          this.prisma,
        );
        break;

      case "only_interests":
        if (!loan.gracePeriod?.days)
          throw new BadRequestException("El préstamo no tiene período de gracia configurado");

        const paidCapital = loan.installments.reduce(
          (sum: Prisma.Decimal, inst: any) =>
            sum.add(new Prisma.Decimal(inst.capitalAmount || 0)),
          new Prisma.Decimal(0),
        );
        const remainingBalance = new Prisma.Decimal(loan.loanAmount)
          .minus(paidCapital)
          .toNumber();

        if (remainingBalance <= 0) {
          this.logger.log(
            `✅ Saldo pendiente 0 para loanId=${loan.id}, no se generará siguiente cuota`,
          );
          return;
        }

        installment = await this.calculateAndCreateInstallment(
          loan,
          nextSequence,
          nextDueDate,
          loan.gracePeriod.days / 30,
          this.prisma,
        );

        const firstInstallmentDate = new Date(loan.installments[0].dueDate);
        const graceEndDate = addDays(firstInstallmentDate, loan.gracePeriod.days);
        const requiresCapitalPayment = nextDueDate > graceEndDate;

        await this.prisma.loan.update({
          where: { id: loanId },
          data: { requiresCapitalPayment },
        });
        break;

      default:
        throw new BadRequestException(
          `Tipo de crédito no soportado: ${loan.loanType.name}`,
        );
    }

    // 🔹 Aplicar saldo a favor (si existe)
    installment = await this.applyPositiveBalance(loanId, installment);

    // 🔹 Actualizar nextDueDate en el préstamo
    await this.prisma.loan.update({
      where: { id: loanId },
      data: { nextDueDate },
    });

    this.logger.log(
      `✅ Cuota creada para loanId=${loan.id}, installmentId=${installment.id}, sequence=${installment.sequence}`,
    );

    return installment;
  }

  /** Aplicar saldo a favor a la cuota recién creada */
  private async applyPositiveBalance(
    loanId: number,
    installment: Installment,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<Installment> {
    this.logger.warn(`🔎 Buscando saldo a favor para loan ${loanId}...`);

    const positiveBalance = await client.positiveBalance.findFirst({
      where: { loanId, isUsed: false },
    });

    if (!positiveBalance) {
      this.logger.warn(`ℹ️ Loan ${loanId}: no hay saldo a favor disponible`);
      return installment;
    }

    let remainingBalance = new Prisma.Decimal(positiveBalance.amount).minus(
      positiveBalance.usedAmount,
    );

    if (remainingBalance.lte(0)) {
      this.logger.warn(`⚠️ Loan ${loanId}: saldo a favor ya consumido`);
      return installment;
    }

    // ---- Aplicar al INTERÉS ----
    let interestCovered = new Prisma.Decimal(0);
    const unpaidInterest = new Prisma.Decimal(installment.interestAmount).minus(
      installment.paidAmount ?? 0, // aquí asumimos que lo no pagado incluye interés
    );

    if (unpaidInterest.gt(0)) {
      const appliedToInterest = Prisma.Decimal.min(remainingBalance, unpaidInterest);
      interestCovered = appliedToInterest;
      remainingBalance = remainingBalance.minus(appliedToInterest);

      await client.positiveBalanceAllocation.create({
        data: {
          installmentId: installment.id,
          positiveBalanceId: positiveBalance.id,
          appliedToInterest: appliedToInterest,
          appliedToCapital: new Prisma.Decimal(0),
        },
      });
    }

    // ---- Aplicar al CAPITAL ----
    let capitalCovered = new Prisma.Decimal(0);
    const unpaidCapital = new Prisma.Decimal(installment.capitalAmount).minus(
      installment.paidAmount ?? 0,
    );

    if (remainingBalance.gt(0) && unpaidCapital.gt(0)) {
      const appliedToCapital = Prisma.Decimal.min(remainingBalance, unpaidCapital);
      capitalCovered = appliedToCapital;
      remainingBalance = remainingBalance.minus(appliedToCapital);

      await client.positiveBalanceAllocation.create({
        data: {
          installmentId: installment.id,
          positiveBalanceId: positiveBalance.id,
          appliedToInterest: new Prisma.Decimal(0),
          appliedToCapital: appliedToCapital,
        },
      });
    }

    // ---- Actualizar cuota ----
    const totalApplied = interestCovered.plus(capitalCovered);
    let newPaidAmount = new Prisma.Decimal(installment.paidAmount ?? 0).plus(totalApplied);

    const updatedInstallment = await client.installment.update({
      where: { id: installment.id },
      data: {
        paidAmount: newPaidAmount,
        isPaid: newPaidAmount.gte(new Prisma.Decimal(installment.totalAmount)),
        paidAt: newPaidAmount.gte(new Prisma.Decimal(installment.totalAmount))
          ? new Date()
          : installment.paidAt,
      },
    });

    // ---- Actualizar saldo a favor ----
    const newUsed = new Prisma.Decimal(positiveBalance.usedAmount).plus(totalApplied);
    const fullyUsed = newUsed.gte(new Prisma.Decimal(positiveBalance.amount));

    await client.positiveBalance.update({
      where: { id: positiveBalance.id },
      data: {
        usedAmount: newUsed,
        isUsed: fullyUsed,
      },
    });

    this.logger.warn(
      `✅ Loan ${loanId}: aplicado saldo a favor. Interés cubierto=${interestCovered.toString()}, Capital cubierto=${capitalCovered.toString()}, Queda disponible=${remainingBalance.toString()}`,
    );

    return updatedInstallment;
  }

  /** Cálculo de la cuota según tipo de crédito con redondeo de centavos */
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
    const interestRateNormalized = interestRateValue.div(100);
    let capitalAmount = new Prisma.Decimal(0);
    let interestAmount = new Prisma.Decimal(0);
    let totalAmount = new Prisma.Decimal(0);

    const installments = loan.installments ?? [];

    switch (loan.loanType.name as "fixed_fees" | "only_interests") {
      case "fixed_fees": {
        const paidCapital = installments.reduce((sum: Prisma.Decimal, inst: any) => {
          return sum.add(new Prisma.Decimal(inst.capitalAmount || 0));
        }, new Prisma.Decimal(0));

        const remainingBalance = loanAmountDecimal.minus(paidCapital);
        const remainingInstallments = termOrGrace - (sequence - 1);
        
        if (remainingInstallments <= 0) {
          this.logger.warn(`Crédito ${loan.id}: no hay más cuotas por calcular (remainingInstallments=${remainingInstallments})`);
          return;
        }

        // 🚀 APLICAR REDONDEO PARA EVITAR CENTAVOS
        if (remainingInstallments === 1) {
          // 📌 ÚLTIMA CUOTA: acumular todo el saldo restante para evitar centavos
          const monthlyRate = interestRateNormalized;
          interestAmount = remainingBalance.times(monthlyRate);
          capitalAmount = remainingBalance;
          totalAmount = capitalAmount.plus(interestAmount);
          
          this.logger.log(`🔧 Última cuota ajustada para loanId=${loan.id}: capital=${capitalAmount.toString()}, interest=${interestAmount.toString()}, total=${totalAmount.toString()}`);
        } else {
          // 📌 CUOTAS INTERMEDIAS: redondear hacia abajo para evitar centavos
          const monthlyRate = interestRateNormalized;
          const temp = monthlyRate.plus(1).pow(remainingInstallments);
          const factor = monthlyRate.times(temp).div(temp.minus(1));
          const theoreticalPayment = remainingBalance.times(factor);
          
          // 🔄 Redondear el pago total hacia abajo (sin centavos)
          const roundedPayment = new Prisma.Decimal(Math.floor(theoreticalPayment.toNumber()));
          
          interestAmount = remainingBalance.times(monthlyRate);
          // 🔄 Redondear interés hacia abajo también
          interestAmount = new Prisma.Decimal(Math.floor(interestAmount.toNumber()));
          
          capitalAmount = roundedPayment.minus(interestAmount);
          totalAmount = roundedPayment;
          
          this.logger.log(`🔧 Cuota redondeada para loanId=${loan.id}, sequence=${sequence}: teórica=${theoreticalPayment.toString()}, redondeada=${roundedPayment.toString()}`);
        }
        break;
      }

      case "only_interests": {
        // 🔄 Para créditos de solo intereses también aplicamos redondeo
        const theoreticalInterest = loanAmountDecimal.times(interestRateNormalized);
        interestAmount = new Prisma.Decimal(Math.floor(theoreticalInterest.toNumber()));
        capitalAmount = new Prisma.Decimal(0);
        totalAmount = interestAmount;
        
        this.logger.log(`🔧 Interés redondeado para loanId=${loan.id}: teórico=${theoreticalInterest.toString()}, redondeado=${interestAmount.toString()}`);
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

    this.logger.log(`✅ Cuota creada con redondeo: loanId=${loan.id}, sequence=${sequence}, capital=${capitalAmount.toNumber()}, interest=${interestAmount.toNumber()}, total=${totalAmount.toNumber()}`);
    return installment;
  }

  /**
   * 💰 Método auxiliar para aplicar tolerancia de centavos en pagos
   * Se puede usar en el módulo de collections para validar pagos
   */
  public applyPaymentTolerance(expectedAmount: Prisma.Decimal, paidAmount: Prisma.Decimal, tolerance: number = 1): {
    isFullyPaid: boolean;
    remainingAmount: Prisma.Decimal;
  } {
    const difference = expectedAmount.minus(paidAmount).abs();
    const toleranceDecimal = new Prisma.Decimal(tolerance);
    
    if (difference.lte(toleranceDecimal)) {
      this.logger.log(`💰 Pago dentro de tolerancia: esperado=${expectedAmount.toString()}, pagado=${paidAmount.toString()}, diferencia=${difference.toString()}`);
      return {
        isFullyPaid: true,
        remainingAmount: new Prisma.Decimal(0)
      };
    }
    
    return {
      isFullyPaid: false,
      remainingAmount: expectedAmount.minus(paidAmount)
    };
  }

  /** ⏱️ Incrementador de fechas según frecuencia */
  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();

    if (freq.includes("DAILY")) return (date) => addDays(date, 1);
    if (freq.includes("WEEKLY")) return (date) => addWeeks(date, 1);
    if (freq.includes("BIWEEKLY")) return (date) => addDays(date, 15);
    if (freq.includes("MONTHLY")) return (date) => addMonths(date, 1);

    // ✅ Ajuste: MINUTE = cada 60 segundos exactos
    if (freq.includes("MINUTE")) return (date) => addSeconds(date, 60);

    // fallback → mensual
    return (date) => addMonths(date, 1);
  }

  /** Calcula fecha de creación anticipada según frecuencia */
  private calculateCreateNextDate(nextDueDate: Date, frequencyName: string): Date {
    const freq = frequencyName.toUpperCase();
    const createDate = new Date(nextDueDate);
    const now = new Date();

    if (freq.includes("MINUTE")) {
      // ✅ Crear exactamente 30s antes del próximo dueDate
      createDate.setSeconds(createDate.getSeconds() - 30);

      // Si esa fecha ya pasó, moverla al siguiente ciclo de 1 minuto
      if (createDate <= now) {
        // sumo un minuto desde ahora y luego resto 30s
        const futureDueDate = addSeconds(now, 60);
        createDate.setTime(futureDueDate.getTime() - 30 * 1000);
      }
    } else if (freq.includes("DAILY")) {
      createDate.setDate(createDate.getDate() - 1);
    } else {
      createDate.setDate(createDate.getDate() - 2);
    }

    this.logger.log(
      `⏱️ Fecha para crear siguiente cuota (createDate) calculada: ${createDate.toISOString()} para frequency=${frequencyName}`
    );
    return createDate;
  }
  public getNextCreateDate(nextDueDate: Date, frequencyName: string): Date {
    return this.calculateCreateNextDate(nextDueDate, frequencyName);
  }
}
