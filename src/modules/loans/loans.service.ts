import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { InstallmentsService } from '@modules/installments/installments.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanPaginationDto } from './dto/loan-pagination.dto';
import { addDays, addMonths, addWeeks } from 'date-fns';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
    private readonly installmentsService: InstallmentsService,
    private readonly rabbitmqService: RabbitMqService,
  ) { }

  private readonly logger = new Logger(LoansService.name);

  // ---------- CREATE ----------
  async create(dto: CreateLoanDto) {
    await this.ensureRefs(dto);

    const { loan, firstInstallment, remainingInstallments, gracePeriodMonths } =
      await this.prisma.$transaction(async tx => {
        // 1️⃣ Obtener loanType
        const loanType = await tx.loanType.findUnique({
          where: { id: dto.loanTypeId },
          select: { id: true, name: true }
        });
        if (!loanType) throw new BadRequestException(`Tipo de crédito no encontrado`);

        // 2️⃣ Validar frecuencia según tipo de crédito
        const freq = await tx.paymentFrequency.findUnique({
          where: { id: dto.paymentFrequencyId }
        });
        if (!freq) throw new BadRequestException(`Frecuencia no encontrada`);

        if (loanType.name === 'fixed_fees') {
          if (freq.name.toUpperCase().includes('MENSUAL') || freq.name.toUpperCase().includes('MONTHLY')) {
            throw new BadRequestException('Crédito tipo fixed_fees no puede tener frecuencia mensual');
          }
        } else if (loanType.name === 'only_interests') {
          if (!freq.name.toUpperCase().includes('MENSUAL') && !freq.name.toUpperCase().includes('MONTHLY')) {
            throw new BadRequestException('Crédito tipo only_interests debe tener frecuencia mensual');
          }
        }

        // 3️⃣ Determinar cuotas (term) o periodo de gracia
        let termValue: number | null = null;
        let termId: number | null = null;
        let gracePeriodId: number | null = null;
        let gracePeriod: number | null = null;

        if (loanType.name === 'fixed_fees') {
          if (dto.termId) {
            const term = await tx.term.findUnique({ where: { id: dto.termId } });
            if (!term) throw new BadRequestException(`Término con ID ${dto.termId} no encontrado`);
            termId = term.id;
            termValue = term.value;
          } else {
            termValue = 12; // default 12 meses
            const newTerm = await tx.term.create({ data: { value: termValue } });
            termId = newTerm.id;
          }
        } else if (loanType.name === 'only_interests') {
          const days = dto.gracePeriod ?? 180; // default 6 meses (180 días)
          const gp = await tx.gracePeriod.findFirst({ where: { days } });
          if (!gp) throw new BadRequestException(`GracePeriod con ${days} días no encontrado en catálogo`);
          gracePeriodId = gp.id;
          gracePeriod = gp.days / 30; // lo pasamos a "meses de gracia" para cálculos
        }

        // 4️⃣ Crear préstamo
        const loan = await tx.loan.create({
          data: {
            customerId: dto.customerId,
            loanAmount: dto.loanAmount,
            remainingBalance: dto.remainingBalance ?? dto.loanAmount,
            interestRateId: dto.interestRateId,
            penaltyRateId: dto.penaltyRateId ?? null,
            paymentAmount: 0,
            termId: termId ?? 0,
            gracePeriodId: gracePeriodId ?? null,
            paymentFrequencyId: dto.paymentFrequencyId,
            loanTypeId: loanType.id,
            loanStatusId: 1, // al día
            startDate: new Date(),
            nextDueDate: null,
            isActive: true,
          },
          include: {
            interestRate: true,
            paymentFrequency: true,
            penaltyRate: true,
            term: true,
            customer: true,
            loanType: true,
            loanStatus: true,
            installments: true,
          }
        });

        // 5️⃣ Crear primera cuota
        const firstInstallment = await this.installmentsService.createFirstInstallment(
          tx,
          loan,
          { termValue, gracePeriod }
        );

        // Actualizar nextDueDate con la fecha de la primera cuota
        await tx.loan.update({
          where: { id: loan.id },
          data: { nextDueDate: firstInstallment.dueDate }
        });

        // 6️⃣ Determinar "restantes"
        let remainingInstallments: number | null = null;
        let gracePeriodMonths: number | null = null;

        if (loanType.name === 'fixed_fees') {
          remainingInstallments = termValue!;
        } else if (loanType.name === 'only_interests') {
          gracePeriodMonths = gracePeriod!;
        }

        return { loan, firstInstallment, remainingInstallments, gracePeriodMonths };
      });

    // 7️⃣ Calcular delay según periodicidad
    const freq = loan.paymentFrequency.name.toUpperCase();
    let delay: number;

    if (freq.includes('DIARIA') || freq.includes('DAILY')) {
      delay = 24 * 60 * 60 * 1000; // 1 día
    } else if (freq.includes('SEMANAL') || freq.includes('WEEKLY')) {
      delay = 7 * 24 * 60 * 60 * 1000; // 7 días
    } else if (freq.includes('QUINCENAL') || freq.includes('BIWEEKLY')) {
      delay = 15 * 24 * 60 * 60 * 1000; // 15 días
    } else if (freq.includes('MENSUAL') || freq.includes('MONTHLY')) {
      delay = 30 * 24 * 60 * 60 * 1000; // 30 días (aprox)
    } else if (freq.includes('MINUTO') || freq.includes('MINUTE')) {
      delay = 60 * 1000; // ⏱️ 1 minuto
    } else {
      delay = 30 * 24 * 60 * 60 * 1000; // fallback mensual
    }

    // 📌 Log más claro: mostrar si es en minutos o días
    let delayDesc: string;
    if (delay < 60 * 1000) {
      delayDesc = `${delay / 1000}s`;
    } else if (delay < 60 * 60 * 1000) {
      delayDesc = `${delay / (60 * 1000)}m`;
    } else {
      delayDesc = `${delay / (24 * 60 * 60 * 1000)}d`;
    }

    // 8️⃣ Publicar mensaje inicial a RabbitMQ
    await this.rabbitmqService.publishWithDelay(
      envs.rabbitMq.loanInstallmentsQueue,
      {
        loanId: loan.id,
        remainingInstallments,
        gracePeriodMonths,
      },
      delay
    );

    this.logger.log(
      `[LoanService] Loan ${loan.id} encolado con delay=${delayDesc} (${freq}) | restantes=${remainingInstallments ?? '∞'}`
    );

    // 9️⃣ Convertir a formato seguro para frontend
    const loanPlain = this.convertLoanToPlain(loan);
    const customerFormatted = this.formatCustomer(loan.customer);

    return { loan: loanPlain, firstInstallment, customer: customerFormatted };
  }

  // ---------- FIND ALL ----------
  async findAll(p: LoanPaginationDto) {
    const page = p.page ?? 1;
    const limit = p.limit ?? 10;
    const where: Prisma.LoanWhereInput = p.isActive !== undefined ? { isActive: p.isActive } : {};

    const total = await this.prisma.loan.count({ where });
    if (total === 0) return { loans: [], meta: { total: 0, page: 1, lastPage: 0, limit, hasNextPage: false } };

    const lastPage = Math.ceil(total / limit) || 1;
    if (page > lastPage) throw new BadRequestException(`La página #${page} no existe`);

    // 👇 Usar include básico (sin customer ni installments)
    const include = this.buildBasicInclude();

    const items = await this.prisma.loan.findMany({
      where,
      include,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
    });

    // ✅ Convertir todos los loans
    const loans = await Promise.all(
      items.map(async (loan) => {
        const loanWithTimestamps = await this.appendTimestamps(loan);
        const plainLoan = this.convertLoanToPlain(loanWithTimestamps);

        return plainLoan;
      })
    );

    return {
      loans,
      meta: {
        total,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage
      }
    };
  }
  async findOne(id: number, include?: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: this.buildInclude(include)
    });

    if (!loan) throw new NotFoundException('Préstamo no encontrado');

    const loanWithTimestamps = await this.appendTimestamps(loan);
    const plainLoan = this.convertLoanToPlain(loanWithTimestamps);

    // ✅ Formatear customer si existe
    if (plainLoan.customer) {
      plainLoan.customer = this.formatCustomer(plainLoan.customer);
    }
    console.log(plainLoan);
    return plainLoan;
  }

  // ---------- UPDATE ----------
  async update(id: number, dto: UpdateLoanDto) {
    const existing = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        interestRate: true,
        term: true,
        paymentFrequency: true,
        loanType: true,
        loanStatus: true,
      }
    });

    if (!existing) throw new NotFoundException('Préstamo no encontrado');

    const detected = this.detectChanges(existing, dto);
    if (!Object.keys(detected).length) throw new BadRequestException('No se detectaron cambios.');

    const data: Prisma.LoanUpdateInput = {};
    const changes: any = [];

    // Campos escalares
    if (detected.remainingBalance !== undefined) {
      data.remainingBalance = new Prisma.Decimal(detected.remainingBalance);
      changes.push({
        field: 'remainingBalance',
        old: existing.remainingBalance?.toNumber?.(),
        new: detected.remainingBalance
      });
    }

    if (detected.paymentAmount !== undefined) {
      data.paymentAmount = detected.paymentAmount === null ?
        null : new Prisma.Decimal(detected.paymentAmount);
      changes.push({
        field: 'paymentAmount',
        old: existing.paymentAmount?.toNumber?.(),
        new: detected.paymentAmount
      });
    }

    if (detected.nextDueDate !== undefined) {
      data.nextDueDate = detected.nextDueDate === null ?
        null : new Date(detected.nextDueDate);
      changes.push({
        field: 'nextDueDate',
        old: existing.nextDueDate,
        new: detected.nextDueDate
      });
    }

    if (detected.isActive !== undefined) {
      data.isActive = detected.isActive;
      changes.push({
        field: 'isActive',
        old: existing.isActive,
        new: detected.isActive
      });
    }

    // Relaciones
    if (detected.loanStatusId !== undefined) {
      data.loanStatus = { connect: { id: detected.loanStatusId } };
      changes.push({
        field: 'loanStatusId',
        old: existing.loanStatusId,
        new: detected.loanStatusId
      });
    }

    if (detected.paymentFrequencyId !== undefined) {
      data.paymentFrequency = { connect: { id: detected.paymentFrequencyId } };
      changes.push({
        field: 'paymentFrequencyId',
        old: existing.paymentFrequencyId,
        new: detected.paymentFrequencyId
      });
    }

    if (detected.loanTypeId !== undefined) {
      data.loanType = { connect: { id: detected.loanTypeId } };
      changes.push({
        field: 'loanTypeId',
        old: existing.loanTypeId,
        new: detected.loanTypeId
      });
    }

    if (detected.interestRateId !== undefined) {
      data.interestRate = { connect: { id: detected.interestRateId } };
      changes.push({
        field: 'interestRateId',
        old: existing.interestRateId,
        new: detected.interestRateId
      });
    }

    if (detected.termId !== undefined) {
      data.term = { connect: { id: detected.termId } };
      changes.push({
        field: 'termId',
        old: existing.termId,
        new: detected.termId
      });
    }

    const updatedCore = await this.prisma.loan.update({
      where: { id },
      data,
      include: {
        interestRate: true,
        term: true,
        paymentFrequency: true,
        loanType: true,
        loanStatus: true,
      }
    });

    const updatedWithTimestamps = await this.appendTimestamps(updatedCore);
    const updated = this.convertLoanToPlain(updatedWithTimestamps);

    return { updated, changes };
  }

  // ---------- SOFT DELETE ----------
  async softDelete(id: number) {
    const existing = await this.prisma.loan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Préstamo no encontrado');

    const core = !existing.isActive ? existing : await this.prisma.loan.update({ where: { id }, data: { isActive: false } });
    return this.appendTimestamps(core);
  }

  // ---------- HELPERS ----------
  private async ensureRefs(dto: CreateLoanDto): Promise<void> {
    const [customer, freq, type, status] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.paymentFrequency.findUnique({ where: { id: dto.paymentFrequencyId } }),
      this.prisma.loanType.findUnique({ where: { id: dto.loanTypeId } }),
      this.prisma.loanStatus.findUnique({ where: { id: dto.loanStatusId } }),
    ]);
    if (!customer) throw new BadRequestException('Customer no encontrado');
    if (!freq) throw new BadRequestException('PaymentFrequency no encontrada');
    if (!type) throw new BadRequestException('LoanType no encontrada');
    if (!status) throw new BadRequestException('LoanStatus no encontrada');
  }

  private buildInclude(include?: string): Prisma.LoanInclude {
    const includeRelations: Prisma.LoanInclude = {
      customer: {
        include: {
          typeDocumentIdentification: true,
          gender: true,
          zone: true
        }
      },
      interestRate: true,
      term: true,
      paymentFrequency: true,
      loanType: true,
      loanStatus: true,
      installments: {
        orderBy: { sequence: 'asc' } // 👈 Ordenar cuotas por secuencia
      }
    };

    if (include) {
      const relations = include.split(',');

      // Si se piden específicamente installments o payments
      if (!relations.includes('installments')) {
        delete includeRelations.installments;
      }

      if (!relations.includes('payments')) {
        delete includeRelations.payments;
      }

      // Puedes agregar más relaciones condicionales aquí
    }

    return includeRelations;
  }

  private async appendTimestamps<T extends { id: number }>(entity: T): Promise<T & { createdAt: Date; updatedAt: Date }> {
    try {
      const { create, lastUpdate } = await this.changesService.getChanges('loan', entity.id);
      const now = new Date();
      return {
        ...entity,
        createdAt: create?.timestamp || (entity as any).createdAt || now,
        updatedAt: lastUpdate?.timestamp || (entity as any).updatedAt || now,
      };
    } catch (error) {
      const now = new Date();
      return {
        ...entity,
        createdAt: (entity as any).createdAt || now,
        updatedAt: (entity as any).updatedAt || now,
      };
    }
  }

  private detectChanges(existing: any, dto: UpdateLoanDto): Partial<UpdateLoanDto> {
    const changes: Partial<UpdateLoanDto> = {};

    // Función mejorada para comparar Decimal
    const compareDecimal = (oldVal: any, newVal: any): boolean => {
      if (newVal === undefined) return false;
      if (oldVal == null && newVal == null) return false;
      if (oldVal == null || newVal == null) return true;

      // Convertir ambos a número para comparar
      const oldNum = typeof oldVal === 'object' && 'toNumber' in oldVal ?
        oldVal.toNumber() : Number(oldVal);
      const newNum = Number(newVal);

      return oldNum !== newNum;
    };

    // Campos escalares
    if (compareDecimal(existing.remainingBalance, dto.remainingBalance)) {
      changes.remainingBalance = dto.remainingBalance;
    }

    if (compareDecimal(existing.paymentAmount, dto.paymentAmount)) {
      changes.paymentAmount = dto.paymentAmount;
    }

    // Fechas - comparar como strings ISO para evitar problemas de timezone
    if (dto.nextDueDate !== undefined) {
      const oldDate = existing.nextDueDate ?
        existing.nextDueDate.toISOString().split('T')[0] : null;
      const newDate = dto.nextDueDate ?
        new Date(dto.nextDueDate).toISOString().split('T')[0] : null;

      if (oldDate !== newDate) {
        changes.nextDueDate = dto.nextDueDate;
      }
    }

    // Booleanos
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      changes.isActive = dto.isActive;
    }

    // Relaciones - comparar números directamente
    if (dto.loanStatusId !== undefined && dto.loanStatusId !== existing.loanStatusId) {
      changes.loanStatusId = dto.loanStatusId;
    }

    if (dto.paymentFrequencyId !== undefined && dto.paymentFrequencyId !== existing.paymentFrequencyId) {
      changes.paymentFrequencyId = dto.paymentFrequencyId;
    }

    if (dto.loanTypeId !== undefined && dto.loanTypeId !== existing.loanTypeId) {
      changes.loanTypeId = dto.loanTypeId;
    }

    if (dto.interestRateId !== undefined && dto.interestRateId !== existing.interestRateId) {
      changes.interestRateId = dto.interestRateId;
    }

    if (dto.termId !== undefined && dto.termId !== existing.termId) {
      changes.termId = dto.termId;
    }

    return changes;
  }

  /**
   * Regenera todas las cuotas de un préstamo: elimina las existentes y crea nuevas.
   */
  async regenerateInstallments(
    loanId: number,
    count: number,
    paymentAmount: number,
  ): Promise<{ generated: number }> {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Préstamo no encontrado');

    if (!loan.paymentFrequencyId) {
      throw new BadRequestException('Falta paymentFrequencyId en el préstamo');
    }

    // Usamos transacción para eliminar y crear cuotas
    await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Eliminar cuotas existentes
      await tx.installment.deleteMany({ where: { loanId } });

      // 2️⃣ Crear nuevas cuotas
      await this.createInstallmentsTx(
        tx,
        loanId,
        count,
        paymentAmount,
        loan.paymentFrequencyId,
        loan.startDate,
      );
    });

    return { generated: count };
  }

  /**
   * Lógica interna para crear cuotas dentro de una transacción
   */
  private async createInstallmentsTx(
    tx: Prisma.TransactionClient,
    loanId: number,
    count: number,
    paymentAmount: number,
    paymentFrequencyId: number,
    startDate: Date,
  ): Promise<void> {
    const freq = await tx.paymentFrequency.findUnique({ where: { id: paymentFrequencyId } });
    if (!freq) throw new BadRequestException('PaymentFrequency no encontrada');

    const increment = this.getIncrementer(freq.name);
    const data: Prisma.InstallmentCreateManyInput[] = [];
    let currentDate = startDate;

    for (let i = 1; i <= count; i++) {
      currentDate = increment(currentDate, i === 1 ? 0 : 1);

      // Por ejemplo, distribuimos 20% de interés y 80% de capital
      const interestPortion = paymentAmount * 0.2;
      const capitalAmount = paymentAmount - interestPortion;

      data.push({
        loanId,
        sequence: i,
        dueDate: currentDate,
        capitalAmount: new Prisma.Decimal(capitalAmount.toFixed(2)),
        interestAmount: new Prisma.Decimal(interestPortion.toFixed(2)),
        totalAmount: new Prisma.Decimal(paymentAmount.toFixed(2)),
        paidAmount: new Prisma.Decimal(0),
        isPaid: false,
        isActive: true,
        paidAt: null,
      });
    }

    await tx.installment.createMany({ data });
  }

  /**
   * Retorna función para incrementar fechas según la frecuencia
   */
  private getIncrementer(freqName: string): (d: Date, step: number) => Date {
    const name = freqName.toUpperCase();
    if (name.includes('DAILY')) return (d, s) => addDays(d, s);
    if (name.includes('WEEK')) return (d, s) => addWeeks(d, s);
    if (name.includes('BIWEEK')) return (d, s) => addWeeks(d, s * 2);
    if (name.includes('MONTH')) return (d, s) => addMonths(d, s);
    return (d, s) => addMonths(d, s); // fallback
  }

  private convertLoanToPlain(loan: any): any {
    // Función helper para convertir Decimal seguro
    const safeConvertDecimal = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      try {
        if (typeof value === 'object' && value !== null) {
          if ('toNumber' in value && typeof value.toNumber === 'function') {
            return value.toNumber();
          }
          return Number(value);
        }
        return Number(value);
      } catch (error) {
        return null;
      }
    };

    const termValue =
      safeConvertDecimal(loan.termValue) ?? // 👈 Primero buscar en nivel principal
      safeConvertDecimal(loan.term?.value); // 👈 Luego en el objeto term

    return {
      ...loan,
      loanAmount: safeConvertDecimal(loan.loanAmount),
      remainingBalance: safeConvertDecimal(loan.remainingBalance),
      paymentAmount: safeConvertDecimal(loan.paymentAmount),

      // 👇 termValue siempre disponible
      termValue: termValue,

      interestRate: loan.interestRate ? {
        ...loan.interestRate,
        value: safeConvertDecimal(loan.interestRate.value)
      } : null,

      term: loan.term ? {
        ...loan.term,
        value: termValue
      } : null,

      paymentFrequency: loan.paymentFrequency,
      loanType: loan.loanType,
      loanStatus: loan.loanStatus,

      installments: loan.installments?.map(installment => ({
        ...installment,
        capitalAmount: safeConvertDecimal(installment.capitalAmount),
        interestAmount: safeConvertDecimal(installment.interestAmount),
        totalAmount: safeConvertDecimal(installment.totalAmount),
        paidAmount: safeConvertDecimal(installment.paidAmount)
      }))
    };
  }

  private formatCustomer(customer: any): any {
    if (!customer) return null;

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      typeDocumentIdentificationId: customer.typeDocumentIdentificationId,
      typeDocumentIdentificationName: customer.typeDocumentIdentification?.name,
      documentNumber: customer.documentNumber,
      genderId: customer.genderId,
      genderName: customer.gender?.name,
      birthDate: customer.birthDate,
      address: customer.address,
      phone: customer.phone,
      zoneId: customer.zoneId,
      zoneName: customer.zone?.name,
      zoneCode: customer.zone?.code,
      userId: customer.userId,
      isActive: customer.isActive
    };
  }

  private buildBasicInclude(): Prisma.LoanInclude {
    // 👇 Solo las relaciones necesarias para la lista básica
    return {
      interestRate: true,
      term: true,
      paymentFrequency: true,
      loanType: true,
      loanStatus: true,
    };
  }

}

