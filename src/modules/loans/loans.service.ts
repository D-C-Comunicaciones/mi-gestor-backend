import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Loan } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { InstallmentsService } from '@modules/installments/installments.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanPaginationDto } from './dto/loan-pagination.dto';
import { addDays, addMonths, addWeeks } from 'date-fns';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
    private readonly installmentsService: InstallmentsService,
  ) { }

// ---------- CREATE ----------
async create(dto: CreateLoanDto) {
  // Validar referencias externas
  await this.ensureRefs(dto);

  // Ejecutar todo en una transacción
  const loan = await this.prisma.$transaction(async tx => {
    let termId: number;

    // Determinar termId según tipo de préstamo
    if (dto.loanTypeId === 1) {
      // Cuotas fijas
      if (dto.termId) {
        termId = dto.termId;
      } else {
        const calculatedValue = Math.ceil(dto.loanAmount / 100);
        const term = await tx.term.create({ data: { value: calculatedValue } });
        termId = term.id;
      }
    } else {
      // Interés mensual flexible → sin cuotas
      const term = await tx.term.create({ data: { value: 0 } });
      termId = term.id;
    }

    // Crear préstamo
    const created = await tx.loan.create({
      data: {
        customerId: dto.customerId,
        loanAmount: dto.loanAmount,
        remainingBalance: dto.remainingBalance ?? dto.loanAmount,
        interestRateId: dto.interestRateId,
        paymentAmount: null,
        termId,
        paymentFrequencyId: dto.paymentFrequencyId,
        loanTypeId: dto.loanTypeId,
        loanStatusId: dto.loanStatusId,
        startDate: new Date(dto.startDate),
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
      },
    });

    // ----------------------------
    // Generar cuotas si aplica
    // ----------------------------
    if (created.loanTypeId === 1) {
      const termValue = (await tx.term.findUnique({ where: { id: termId } }))!.value;

      // Llamada al InstallmentsService usando la transacción
      await this.installmentsService.create(
        {
          loanId: created.id,
          count: termValue,
          startDate: created.startDate,
          paymentFrequencyId: created.paymentFrequencyId,
        },
        tx
      );
    } else if (created.loanTypeId === 2 || created.loanTypeId === 3) {
      // Solo actualizar nextDueDate mensual
      const nextDue = addMonths(created.startDate, 1);
      await tx.loan.update({
        where: { id: created.id },
        data: { nextDueDate: nextDue },
      });
    } else {
      throw new BadRequestException('LoanType no soportado');
    }

    return created;
  });

  return this.appendTimestamps(loan);
}


  // ---------- FIND ----------
  async findAll(p: LoanPaginationDto) {
    const page = p.page ?? 1;
    const limit = p.limit ?? 10;
    const where: Prisma.LoanWhereInput = p.isActive !== undefined ? { isActive: p.isActive } : {};

    const total = await this.prisma.loan.count({ where });
    if (total === 0) return { rawLoans: [], meta: { total: 0, page: 1, lastPage: 0, limit, hasNextPage: false } };

    const lastPage = Math.ceil(total / limit) || 1;
    if (page > lastPage) throw new BadRequestException(`La página #${page} no existe`);

    const include = this.buildInclude(p.include);
    const items = await this.prisma.loan.findMany({
      where,
      include,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
    });

    const rawLoans = await Promise.all(items.map(l => this.appendTimestamps(l)));

    return { rawLoans, meta: { total, page, lastPage, limit, hasNextPage: page < lastPage } };
  }

  async findOne(id: number, include?: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id }, include: this.buildInclude(include) });
    if (!loan) throw new NotFoundException('Préstamo no encontrado');
    return this.appendTimestamps(loan);
  }

  // ---------- UPDATE ----------
  async update(id: number, dto: UpdateLoanDto) {
    const existing = await this.prisma.loan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Préstamo no encontrado');

    const detected = this.detectChanges(existing, dto);
    if (!Object.keys(detected).length) throw new BadRequestException('No se detectaron cambios.');

    const data: Prisma.LoanUpdateInput = {};
    const changes: any = [];

    // Campos escalares
    if (detected.remainingBalance !== undefined) {
      data.remainingBalance = new Prisma.Decimal(detected.remainingBalance as number);
      changes.push({ field: 'remainingBalance', old: existing.remainingBalance, new: detected.remainingBalance });
    }
    if (detected.paymentAmount !== undefined) {
      data.paymentAmount = detected.paymentAmount === null ? null : new Prisma.Decimal(detected.paymentAmount as number);
      changes.push({ field: 'paymentAmount', old: existing.paymentAmount, new: detected.paymentAmount });
    }
    if (detected.nextDueDate !== undefined) {
      data.nextDueDate = detected.nextDueDate === null ? null : new Date(detected.nextDueDate as string);
      changes.push({ field: 'nextDueDate', old: existing.nextDueDate, new: detected.nextDueDate });
    }
    if (detected.isActive !== undefined) {
      data.isActive = detected.isActive as boolean;
      changes.push({ field: 'isActive', old: existing.isActive, new: detected.isActive });
    }

    // Relaciones
    if (detected.loanStatusId !== undefined) {
      data.loanStatus = { connect: { id: detected.loanStatusId as number } };
      changes.push({ field: 'loanStatusId', old: existing.loanStatusId, new: detected.loanStatusId });
    }
    if (detected.paymentFrequencyId !== undefined) {
      data.paymentFrequency = { connect: { id: detected.paymentFrequencyId as number } };
      changes.push({ field: 'paymentFrequencyId', old: existing.paymentFrequencyId, new: detected.paymentFrequencyId });
    }
    if (detected.loanTypeId !== undefined) {
      data.loanType = { connect: { id: detected.loanTypeId as number } };
      changes.push({ field: 'loanTypeId', old: existing.loanTypeId, new: detected.loanTypeId });
    }
    if (detected.interestRateId !== undefined) {
      data.interestRate = { connect: { id: detected.interestRateId as number } };
      changes.push({ field: 'interestRateId', old: existing.interestRateId, new: detected.interestRateId });
    }
    if (detected.termId !== undefined) {
      data.term = { connect: { id: detected.termId as number } };
      changes.push({ field: 'termId', old: existing.termId, new: detected.termId });
    }

    const updatedCore = await this.prisma.loan.update({ where: { id }, data });
    const updated = await this.appendTimestamps(updatedCore);

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

  private buildInclude(include?: string): Prisma.LoanInclude | undefined {
    if (!include) return undefined;
    const parts = include.split(',').map(p => p.trim().toLowerCase());
    return {
      customer: parts.includes('customer'),
      paymentFrequency: parts.includes('frequency'),
      loanType: parts.includes('type'),
      loanStatus: parts.includes('status'),
      installments: parts.includes('installments'),
      payments: parts.includes('payments'),
    };
  }

  private async appendTimestamps<T extends { id: number }>(entity: T): Promise<T & { createdAt: Date; updatedAt: Date }> {
    const { create, lastUpdate } = await this.changesService.getChanges('loan', entity.id).catch(() => ({ create: null, lastUpdate: null }));
    const now = new Date();
    return {
      ...entity,
      createdAt: create?.timestamp || lastUpdate?.timestamp || now,
      updatedAt: lastUpdate?.timestamp || create?.timestamp || now,
    };
  }

  private detectChanges(existing: Loan, dto: UpdateLoanDto): Partial<UpdateLoanDto> {
    const changes: Partial<UpdateLoanDto> = {};

    const compareDecimal = (oldVal: any, newVal: any) => {
      if (newVal === undefined) return false;
      if (oldVal == null && newVal == null) return false;
      if (oldVal == null || newVal == null) return true;
      return oldVal.toString() !== newVal.toString();
    };

    // Campos escalares
    if (compareDecimal(existing.remainingBalance, dto.remainingBalance)) changes.remainingBalance = dto.remainingBalance;
    if (compareDecimal(existing.paymentAmount, dto.paymentAmount)) changes.paymentAmount = dto.paymentAmount;

    // Fechas
    if (dto.nextDueDate !== undefined) {
      const oldDate = existing.nextDueDate ? existing.nextDueDate.toISOString().split('T')[0] : null;
      const newDate = dto.nextDueDate === null ? null : new Date(dto.nextDueDate).toISOString().split('T')[0];
      if (oldDate !== newDate) changes.nextDueDate = dto.nextDueDate;
    }

    // Booleanos
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) changes.isActive = dto.isActive;

    // Relaciones
    if (dto.loanStatusId !== undefined && dto.loanStatusId !== existing.loanStatusId) changes.loanStatusId = dto.loanStatusId;
    if (dto.paymentFrequencyId !== undefined && dto.paymentFrequencyId !== existing.paymentFrequencyId) changes.paymentFrequencyId = dto.paymentFrequencyId;
    if (dto.loanTypeId !== undefined && dto.loanTypeId !== existing.loanTypeId) changes.loanTypeId = dto.loanTypeId;
    if (dto.interestRateId !== undefined && dto.interestRateId !== existing.interestRateId) changes.interestRateId = dto.interestRateId;
    if (dto.termId !== undefined && dto.termId !== existing.termId) changes.termId = dto.termId;

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
}
