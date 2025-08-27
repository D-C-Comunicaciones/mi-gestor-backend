import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { InstallmentsService } from '@modules/installments/installments.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanPaginationDto } from './dto/loan-pagination.dto';
import { addDays, addMonths, addWeeks, differenceInDays, format } from 'date-fns';
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

    const { responseLoan, firstInstallment } = await this.prisma.$transaction(async tx => {
      // 1️⃣ Validaciones y obtención de referencias
      const loanType = await tx.loanType.findUnique({
        where: { id: dto.loanTypeId },
        select: { id: true, name: true },
      });
      if (!loanType) throw new BadRequestException('Tipo de crédito no encontrado');

      const freq = await tx.paymentFrequency.findUnique({
        where: { id: dto.paymentFrequencyId },
      });
      if (!freq) throw new BadRequestException('Frecuencia no encontrada');

      // 2️⃣ Validación específica por tipo de crédito
      let termId: number | undefined,
          termValue: number | null = null;
      let gracePeriodId: number | undefined,
          gracePeriodMonths: number | null = null,
          graceEndDate: Date | null = null;

      if (loanType.name === 'fixed_fees') {
        if (dto.gracePeriodId) {
          throw new BadRequestException('Periodo de Gracia no debe ser proporcionado para créditos de cuotas fijas');
        }
        if (dto.termId) {
          const term = await tx.term.findUnique({ where: { id: dto.termId } });
          if (!term) throw new BadRequestException(`Término con ID ${dto.termId} no encontrado`);
          termId = term.id;
          termValue = term.value;
        } else {
          termValue = 12;
          termId = (await tx.term.create({ data: { value: termValue } })).id;
        }
      } else if (loanType.name === 'only_interests') {
        if (dto.termId) {
          throw new BadRequestException('# de cuotas no debe ser proporcionado para créditos de solo intereses');
        }
        if (!dto.gracePeriodId) {
          throw new BadRequestException('GracePeriodId requerido para créditos de solo intereses');
        }
        const gp = await tx.gracePeriod.findUnique({ where: { id: dto.gracePeriodId } });
        if (!gp) throw new BadRequestException(`GracePeriod con ID ${dto.gracePeriodId} no encontrado`);
        gracePeriodId = gp.id;
        gracePeriodMonths = gp.days / 30;
        graceEndDate = new Date();
        graceEndDate.setDate(graceEndDate.getDate() + gp.days);
      } else {
        throw new BadRequestException(`Tipo de crédito no soportado: ${loanType.name}`);
      }

      // 3️⃣ Crear préstamo
      const loan = await tx.loan.create({
        data: {
          customerId: dto.customerId,
          loanAmount: new Prisma.Decimal(dto.loanAmount ?? 0),
          remainingBalance: new Prisma.Decimal(dto.loanAmount ?? 0),
          interestRateId: dto.interestRateId,
          penaltyRateId: dto.penaltyRateId,
          paymentAmount: new Prisma.Decimal(0),
          termId,
          gracePeriodId,
          graceEndDate,
          paymentFrequencyId: dto.paymentFrequencyId,
          loanTypeId: loanType.id,
          loanStatusId: dto.loanStatusId,
          startDate: new Date(),
          nextDueDate: null,
          isActive: true,
        },
        include: {
          interestRate: true,
          penaltyRate: true,
          term: true,
          paymentFrequency: true,
          loanType: true,
          loanStatus: true,
          customer: {
            include: {
              typeDocumentIdentification: true,
              gender: true,
              zone: true,
              user: true 
            },
          },
        },
      });

      // 4️⃣ Crear primera cuota
      const firstInst = await this.installmentsService.createFirstInstallment(
        tx, loan, { termValue, gracePeriod: gracePeriodMonths }
      );

      // 5️⃣ Obtener timestamps del firstInstallment
      let firstInstallmentWithTimestamps = firstInst;
      if (firstInst?.id) {
        try {
          const instChanges = await this.changesService.getChanges('installment', firstInst.id);
          firstInstallmentWithTimestamps = {
            ...firstInst,
            createdAtTimestamp: instChanges.create?.timestamp,
            updatedAtTimestamp: instChanges.lastUpdate?.timestamp || instChanges.create?.timestamp,
          };
        } catch {
          // fallback
        }
      }

      // 6️⃣ Actualizar nextDueDate
      const loanUpdated = await tx.loan.update({
        where: { id: loan.id },
        data: { nextDueDate: firstInst.dueDate },
        include: {
          interestRate: true,
          penaltyRate: true,
          term: true,
          paymentFrequency: true,
          loanType: true,
          loanStatus: true,
          customer: {
            include: {
              typeDocumentIdentification: true,
              gender: true,
              zone: true,
              user: true, 
            },
          },
        },
      });

      // 7️⃣ Convertir a plain object
      const loanPlain = this.convertLoanToPlain(loanUpdated);
      const loanChanges = await this.changesService.getChanges('loan', loanUpdated.id);

      // 8️⃣ Obtener timestamps del customer
      let customerWithTimestamps = loanPlain.customer;
      if (loanPlain.customer?.id) {
        try {
          const custChanges = await this.changesService.getChanges('customer', loanPlain.customer.id);
          customerWithTimestamps = {
            ...loanPlain.customer,
            createdAtTimestamp: custChanges.create?.timestamp,
            updatedAtTimestamp: custChanges.lastUpdate?.timestamp || custChanges.create?.timestamp,
          };
        } catch {
          // fallback
        }
      }

      // 9️⃣ Mapear loan y adjuntar customer
      const mappedLoan = this._mapLoan(loanPlain, loanChanges);
      mappedLoan.customer = {
        ...customerWithTimestamps,
        // reconstruir para el DTO
        typeDocumentIdentificationName: customerWithTimestamps.typeDocumentIdentification?.name,
        typeDocumentIdentificationCode: customerWithTimestamps.typeDocumentIdentification?.code,
        genderName: customerWithTimestamps.gender?.name,
        zoneName: customerWithTimestamps.zone?.name,
        zoneCode: customerWithTimestamps.zone?.code ,
        email: customerWithTimestamps.user.email
      };

      // 🔟 Transformar firstInstallment
      const plainFirstInst = this.convertLoanToPlain(firstInstallmentWithTimestamps);
      const mappedFirstInst = plainFirstInst && { ...plainFirstInst };

      return {
        responseLoan: { ...mappedLoan, firstInstallment: mappedFirstInst },
        firstInstallment: mappedFirstInst,
      };
    });

    return { loan: responseLoan, firstInstallment };
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

    // ✅ Obtener timestamps del customer desde changesService
    if (plainLoan.customer?.id) {
      try {
        const customerChanges = await this.changesService.getChanges('customer', plainLoan.customer.id);
        plainLoan.customer = {
          ...plainLoan.customer,
          // Agregar timestamps para que el DTO los use
          createdAtTimestamp: customerChanges.create?.timestamp,
          updatedAtTimestamp: customerChanges.lastUpdate?.timestamp || customerChanges.create?.timestamp
        };
      } catch (error) {
        console.warn('Error obteniendo cambios del customer:', error);
        // Si falla, mantener el customer original
      }
    }

    // ✅ Obtener timestamps de cada installment si existen
    if (plainLoan.installments && Array.isArray(plainLoan.installments)) {
      for (let i = 0; i < plainLoan.installments.length; i++) {
        const installment = plainLoan.installments[i];
        if (installment?.id) {
          try {
            const installmentChanges = await this.changesService.getChanges('installment', installment.id);
            plainLoan.installments[i] = {
              ...installment,
              createdAtTimestamp: installmentChanges.create?.timestamp,
              updatedAtTimestamp: installmentChanges.lastUpdate?.timestamp || installmentChanges.create?.timestamp
            };
          } catch (error) {
            console.warn(`Error obteniendo cambios del installment ${installment.id}:`, error);
            // Si falla, mantener el installment original
          }
        }
      }
    }

    // ✅ Obtener timestamps de firstInstallment si existe
    if (plainLoan.firstInstallment?.id) {
      try {
        const installmentChanges = await this.changesService.getChanges('installment', plainLoan.firstInstallment.id);
        plainLoan.firstInstallment = {
          ...plainLoan.firstInstallment,
          createdAtTimestamp: installmentChanges.create?.timestamp,
          updatedAtTimestamp: installmentChanges.lastUpdate?.timestamp || installmentChanges.create?.timestamp
        };
      } catch (error) {
        console.warn('Error obteniendo cambios del firstInstallment:', error);
        // Si falla, mantener el firstInstallment original
      }
    }

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
    interestRate: true,
    penaltyRate: true,
    term: true,
    paymentFrequency: true,
    loanType: true,
    loanStatus: true,
    customer: {
      include: {
        typeDocumentIdentification: true,
        gender: true,
        zone: true
      }
    },
    installments: {
      orderBy: { sequence: 'asc' }
    }
  };

  if (include) {
    const relations = include.split(',');

    if (!relations.includes('installments')) {
      delete includeRelations.installments;
    }

    if (!relations.includes('customer')) {
      delete includeRelations.customer;
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

private convertLoanToPlain(obj: any): any {
  // SOLUCIÓN NUCLEAR - Convierte TODOS los Decimals a números
  const jsonString = JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
      return value.toNumber(); // Convertir Decimal a número
    }
    return value; // Mantener todo lo demás
  });
  
  return JSON.parse(jsonString);
}
  private buildBasicInclude(include?: string): Prisma.LoanInclude {
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
        orderBy: { sequence: 'asc' }
      }
    };

    if (include) {
      const relations = include.split(',');

      if (!relations.includes('installments')) {
        delete includeRelations.installments;
      }

      if (!relations.includes('customer')) {
        delete includeRelations.customer;
      }

      // Puedes agregar más relaciones condicionales aquí
    }

    return includeRelations;
  }

  private _mapLoan(loan: any, loanChanges: any) {
  // Mantener las relaciones completas para que el DTO pueda transformarlas
  return {
    ...loan,
    
    // Campos calculados del loan
    interestRateValue: loan.interestRate?.value ?? 0,
    penaltyRateValue: loan.penaltyRate?.value ?? 0,
    termValue: loan.term?.value ?? null,
    paymentFrequencyName: loan.paymentFrequency?.name || '',
    loanTypeName: loan.loanType?.name || '',
    loanStatusName: loan.loanStatus?.name || '',
        
    // Campos de fechas formateados
    startDate: loan.startDate ? format(new Date(loan.startDate), 'yyyy-MM-dd') : '',
    nextDueDate: loan.nextDueDate ? format(new Date(loan.nextDueDate), 'yyyy-MM-dd') : undefined,
    graceEndDate: loan.graceEndDate ? format(new Date(loan.graceEndDate), 'yyyy-MM-dd') : null,
    
    // Campos calculados de grace
    gracePeriodMonths: loan.gracePeriodMonths ?? 0,
    graceDaysLeft: loan.graceEndDate ? Math.max(0, differenceInDays(new Date(loan.graceEndDate), new Date())) : null,
    
    // Timestamps del loan
    createdAt: loanChanges.create?.timestamp ? format(new Date(loanChanges.create.timestamp), 'yyyy-MM-dd HH:mm:ss') : 
              loan.createdAt ? format(new Date(loan.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
    updatedAt: loanChanges.lastUpdate?.timestamp ? format(new Date(loanChanges.lastUpdate.timestamp), 'yyyy-MM-dd HH:mm:ss') :
              loanChanges.create?.timestamp ? format(new Date(loanChanges.create.timestamp), 'yyyy-MM-dd HH:mm:ss') :
              loan.updatedAt ? format(new Date(loan.updatedAt), 'yyyy-MM-dd HH:mm:ss') : ''
  };
}
}

