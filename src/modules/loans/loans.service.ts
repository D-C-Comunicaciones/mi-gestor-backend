import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { InstallmentsService } from '@modules/installments/installments.service';
import { CreateLoanDto, RefinanceLoanDto, LoanPaginationDto } from './dto';
import { differenceInDays, format } from 'date-fns';
import { PaginationDto } from '@common/dto';
import { LoanStrategyFactory } from './strategies/factories';
import { TranslationService } from '@modules/translations/translations.service';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
    private readonly installmentsService: InstallmentsService,
    private readonly loanStrategyFactory: LoanStrategyFactory,
    private readonly translationService: TranslationService
  ) { }

  // ---------- CREATE (REFACTORIZADO) ----------
  async create(dto: CreateLoanDto) {
    await this.ensureRefs(dto);

    const { responseLoan, firstInstallment } = await this.prisma.$transaction(async tx => {
      // 1️⃣ Obtener el tipo de crédito
      const loanType = await tx.loanType.findUnique({
        where: { id: dto.loanTypeId },
        select: { id: true, name: true },
      });
      if (!loanType) throw new BadRequestException('Tipo de crédito no encontrado');

      // 2️⃣ Validar frecuencia de pago
      const freq = await tx.paymentFrequency.findUnique({
        where: { id: dto.paymentFrequencyId },
      });
      if (!freq) throw new BadRequestException('Frecuencia no encontrada');

      // 3️⃣ Obtener estrategia para el tipo de crédito
      const strategy = this.loanStrategyFactory.getStrategy(loanType.name);

      // 4️⃣ Validar DTO específico del tipo de crédito
      await strategy.validateDto(dto);

      // 5️⃣ Preparar datos específicos del tipo de crédito
      const loanData = await strategy.prepareLoanData(dto, tx);

      // 6️⃣ Crear préstamo
      const loan = await tx.loan.create({
        data: {
          customerId: dto.customerId,
          loanAmount: new Prisma.Decimal(dto.loanAmount ?? 0),
          remainingBalance: new Prisma.Decimal(dto.loanAmount ?? 0),
          interestRateId: dto.interestRateId,
          penaltyRateId: dto.penaltyRateId,
          termId: loanData.termId,
          gracePeriodId: loanData.gracePeriodId,
          graceEndDate: loanData.graceEndDate,
          paymentFrequencyId: dto.paymentFrequencyId,
          loanTypeId: loanType.id,
          loanStatusId: 1, // ACTIVO
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

      // 7️⃣ Crear primera cuota
      const firstInst = await this.installmentsService.createFirstInstallment(
        tx, loan, {
        termValue: loanData.termValue,
        gracePeriod: loanData.gracePeriodMonths
      }
      );

      // 8️⃣ Procesar timestamps y mapear como antes...
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

      // 9️⃣ Actualizar nextDueDate
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

      // 🔟 Resto del mapeo igual que antes...
      const loanPlain = this.convertLoanToPlain(loanUpdated);
      const loanChanges = await this.changesService.getChanges('loan', loanUpdated.id);

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

      const mappedLoan = this._mapLoan(loanPlain, loanChanges);
      mappedLoan.customer = {
        ...customerWithTimestamps,
        typeDocumentIdentificationName: customerWithTimestamps.typeDocumentIdentification?.name,
        typeDocumentIdentificationCode: customerWithTimestamps.typeDocumentIdentification?.code,
        genderName: customerWithTimestamps.gender?.name,
        zoneName: customerWithTimestamps.zone?.name,
        zoneCode: customerWithTimestamps.zone?.code,
        email: customerWithTimestamps.user.email
      };

      const plainFirstInst = this.convertLoanToPlain(firstInstallmentWithTimestamps);
      const mappedFirstInst = plainFirstInst && { ...plainFirstInst };

      return {
        responseLoan: { ...mappedLoan, firstInstallment: mappedFirstInst },
        firstInstallment: mappedFirstInst,
      };
    });

    return { loan: responseLoan, firstInstallment };
  }

  // ---------- REFINANCE ----------
  async refinance(loanId: number, dto: RefinanceLoanDto) {
    // 1️⃣ Obtener préstamo existente
    const existingLoan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        interestRate: true,
        penaltyRate: true,
        term: true,
        paymentFrequency: true,
        loanType: true,
        loanStatus: true,
        customer: true,
        installments: true,
      },
    });

    if (!existingLoan) throw new NotFoundException('Préstamo a refinanciar no encontrado');
    if (!existingLoan.isActive) throw new BadRequestException('El préstamo ya está inactivo o refinanciado.');

    const remainingBalance = existingLoan.remainingBalance?.toNumber?.() ?? 0;
    if (remainingBalance <= 0) throw new BadRequestException('El préstamo no tiene saldo pendiente para refinanciar.');

    // 2️⃣ Estado "Refinanced"
    const refinancedStatus = await this.prisma.loanStatus.findUnique({ where: { name: 'Refinanced' } });
    if (!refinancedStatus) throw new NotFoundException('El estado "Refinanced" no fue encontrado.');

    // 3️⃣ Estrategia según tipo de préstamo original
    const loanTypeRecord = await this.prisma.loanType.findUnique({ where: { id: existingLoan.loanTypeId } });
    if (!loanTypeRecord) throw new NotFoundException('Tipo de préstamo no encontrado.');

    const strategy = this.loanStrategyFactory.getStrategy(loanTypeRecord.name);

    // 🔹 Construir DTO temporal completo
    const completeDto: CreateLoanDto = {
      customerId: existingLoan.customerId,
      loanAmount: remainingBalance,
      interestRateId: dto.interestRateId ?? existingLoan.interestRateId,
      penaltyRateId: dto.penaltyRateId ?? existingLoan.penaltyRateId ?? undefined,
      paymentFrequencyId: dto.paymentFrequencyId ?? existingLoan.paymentFrequencyId,
      loanTypeId: existingLoan.loanTypeId,
      termId: dto.termId ?? undefined,
      gracePeriodId: dto.gracePeriodId ?? undefined,
    };

    // 4️⃣ Validaciones según tipo de crédito
    const freq = await this.prisma.paymentFrequency.findUnique({ where: { id: completeDto.paymentFrequencyId } });

    if (loanTypeRecord.name === 'only_interests') {
      if (!completeDto.gracePeriodId) throw new BadRequestException('Crédito only_interests requiere gracePeriodId');
      if (completeDto.termId) throw new BadRequestException('Crédito only_interests no puede tener termId');
      if (freq?.name !== 'Monthly') throw new BadRequestException('Crédito only_interests solo puede tener frecuencia mensual');
    } else if (loanTypeRecord.name === 'fixed_fees') {
      if (!completeDto.termId) throw new BadRequestException('Crédito fixed_fees requiere termId');
      if (completeDto.gracePeriodId) throw new BadRequestException('Crédito fixed_fees no puede tener gracePeriodId');
      if (freq?.name === 'Monthly') throw new BadRequestException('Crédito fixed_fees no puede tener frecuencia mensual');
    }

    // 5️⃣ Crear préstamo en transacción (aplicable a cualquier tipo)
    const { oldLoan, newLoan } = await this.prisma.$transaction(async (tx) => {
      const inactiveLoan = await tx.loan.update({
        where: { id: loanId },
        data: { isActive: false, loanStatusId: refinancedStatus.id },
        include: { installments: true },
      });

      const preparedData = await strategy.prepareLoanData(completeDto, tx);

      const finalDto: CreateLoanDto = {
        ...completeDto,
        termId: preparedData.termId ?? completeDto.termId,
        gracePeriodId: preparedData.gracePeriodId ?? completeDto.gracePeriodId,
      };

      const newLoanResponse = await this.create(finalDto);

      return { oldLoan: inactiveLoan, newLoan: newLoanResponse.loan };
    });

    // 6️⃣ Auditoría
    const oldLoanChanges = await this.changesService.getChanges('loan', oldLoan.id);
    const newLoanChanges = await this.changesService.getChanges('loan', newLoan.id);

    return {
      rawOldLoan: this._mapLoan(this.convertLoanToPlain(oldLoan), oldLoanChanges),
      rawNewLoan: this._mapLoan(this.convertLoanToPlain(newLoan), newLoanChanges),
    };
  }

  // ---------- FIND ALL ----------
  async findAll(p: LoanPaginationDto) {
      const page = p.page ?? 1;
      const limit = p.limit ?? 10;
      const where: Prisma.LoanWhereInput = p.isActive !== undefined
        ? { isActive: p.isActive }
        : {};

      const total = await this.prisma.loan.count({ where });
      if (total === 0) {
        return {
          loans: [],
          meta: { total: 0, page: 1, lastPage: 0, limit, hasNextPage: false },
        };
      }

      const lastPage = Math.ceil(total / limit) || 1;
      if (page > lastPage) {
        throw new BadRequestException(`La página #${page} no existe`);
      }

      const items = await this.prisma.loan.findMany({
        where,
        include: {
          interestRate: true,
          penaltyRate: true,
          term: true,
          paymentFrequency: true,
          loanType: true,
          loanStatus: true,
          customer: { // ✅ Incluir información del customer
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          installments: { orderBy: { sequence: 'asc' } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
      });

      const loans = await Promise.all(
        items.map(async loan => {
          // timestamps for loan
          const loanChanges = await this.changesService.getChanges('loan', loan.id);

          const loanPlain = this.convertLoanToPlain({
            ...loan,
            createdAtTimestamp: loanChanges.create?.timestamp,
            updatedAtTimestamp: loanChanges.lastUpdate?.timestamp ?? loanChanges.create?.timestamp,
          });

          // installments timestamps
          for (const inst of loanPlain.installments) {
            const ch = await this.changesService.getChanges('installment', inst.id);
            (inst as any).createdAtTimestamp = ch.create?.timestamp;
            (inst as any).updatedAtTimestamp = ch.lastUpdate?.timestamp ?? ch.create?.timestamp;
          }

          // map loan
          const mappedLoan = this._mapLoan(loanPlain, loanChanges);

          return mappedLoan;
        })
      );

      return {
        loans,
        meta: {
          total,
          page,
          lastPage,
          limit,
          hasNextPage: page < lastPage,
        },
      };
    }

  async findOne(id: number, include ?: string) {
      // 1️⃣ Obtener préstamo con relaciones necesarias
      const loan = await this.prisma.loan.findUnique({
        where: { id },
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
              user: true,            // Incluir user para email
            },
          },
          installments: { orderBy: { sequence: 'asc' } },
        },
      });
      if (!loan) throw new NotFoundException('Préstamo no encontrado');

      // 2️⃣ Obtener timestamps del préstamo
      const loanChanges = await this.changesService.getChanges('loan', id);

      // 3️⃣ Convertir a objeto plano y adjuntar timestamps
      const loanPlain = this.convertLoanToPlain({
        ...loan,
        createdAtTimestamp: loanChanges.create?.timestamp,
        updatedAtTimestamp: loanChanges.lastUpdate?.timestamp ?? loanChanges.create?.timestamp,
      });

      // 4️⃣ Procesar timestamps de customer
      const custRaw = loanPlain.customer;
      const custChanges = await this.changesService.getChanges('customer', custRaw.id);
      (custRaw as any).createdAtTimestamp = custChanges.create?.timestamp;
      (custRaw as any).updatedAtTimestamp = custChanges.lastUpdate?.timestamp ?? custChanges.create?.timestamp;

      // 5️⃣ Procesar timestamps de installments
      if (Array.isArray(loanPlain.installments)) {
        for (const inst of loanPlain.installments) {
          const ch = await this.changesService.getChanges('installment', inst.id);
          (inst as any).createdAtTimestamp = ch.create?.timestamp;
          (inst as any).updatedAtTimestamp = ch.lastUpdate?.timestamp ?? ch.create?.timestamp;
        }
      }

      // 6️⃣ Procesar timestamps de firstInstallment
      if (loanPlain.firstInstallment?.id) {
        const ch = await this.changesService.getChanges('installment', loanPlain.firstInstallment.id);
        (loanPlain.firstInstallment as any).createdAtTimestamp = ch.create?.timestamp;
        (loanPlain.firstInstallment as any).updatedAtTimestamp = ch.lastUpdate?.timestamp ?? ch.create?.timestamp;
      }

      // 7️⃣ Mapear préstamo a respuesta
      const mappedLoan = this._mapLoan(loanPlain, loanChanges);

      // 8️⃣ Reconstruir customer para el DTO
      const rawCustomer = loan.customer;
      mappedLoan.customer = {
        id: custRaw.id,
        firstName: custRaw.firstName,
        lastName: custRaw.lastName,
        email: rawCustomer.user?.email ?? null,
        typeDocumentIdentificationId: custRaw.typeDocumentIdentificationId,
        typeDocumentIdentificationName: rawCustomer.typeDocumentIdentification?.name,
        documentNumber: custRaw.documentNumber,
        birthDate: custRaw.birthDate,
        genderId: custRaw.genderId,
        genderName: rawCustomer.gender?.name,
        phone: custRaw.phone,
        address: custRaw.address,
        zoneId: custRaw.zoneId,
        zoneName: rawCustomer.zone?.name,
        zoneCode: rawCustomer.zone?.code,
        isActive: custRaw.isActive,
        createdAtTimestamp: (custRaw as any).createdAtTimestamp,
        updatedAtTimestamp: (custRaw as any).updatedAtTimestamp,
      };

      // 9️⃣ Adjuntar cuotas
      mappedLoan.installments = loanPlain.installments;
      mappedLoan.firstInstallment = loanPlain.firstInstallment;

      return mappedLoan;
    }

  /**
   * Obtiene préstamos con cuotas en mora
   */
  async getOverdueLoans(queryDto: PaginationDto) {
      const { page = 1, limit = 10 } = queryDto;

      // Buscar el estado 'Overdue' para préstamos
      const overdueLoanStatus = await this.prisma.loanStatus.findFirst({
        where: { name: { equals: 'Overdue', mode: 'insensitive' } }
      });

      if (!overdueLoanStatus) {
        throw new BadRequestException('No se encontró el estado "Overdue" para préstamos');
      }

      const where = {
        isActive: true,
        loanStatusId: overdueLoanStatus.id
      };

      const total = await this.prisma.loan.count({ where });

      if (total === 0) {
        return {
          overdueLoans: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit,
            hasNextPage: false,
          },
        };
      }

      const lastPage = Math.ceil(total / limit);
      if (page > lastPage) {
        throw new BadRequestException(`La página #${page} no existe`);
      }

      const loans = await this.prisma.loan.findMany({
        where,
        include: {
          customer: {
            include: {
              zone: true
            },
          },
          loanType: true,
          loanStatus: true,
          installments: {
            where: { isActive: true },
            include: {
              moratoryInterests: {
                where: { isPaid: false },
                include: {
                  moratoryInterestStatus: true
                }
              },
            },
            orderBy: { sequence: 'asc' }
          },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const overdueLoans = loans.map((loan) => {
        let totalMoratoryAmount = 0;
        let totalDaysLate = 0;

        // Consolidado por cuota
        const installmentsWithMoratory = loan.installments.map((installment) => {
          let installmentMoratoryAmount = 0;
          let installmentDaysLate = 0;

          installment.moratoryInterests.forEach((mora) => {
            if (!mora.isPaid && mora.moratoryInterestStatus.name.toLowerCase() === 'unpaid') {
              installmentMoratoryAmount += Number(mora.amount);
              installmentDaysLate += mora.daysLate || 0;
            }
          });

          // Sumar al total del préstamo
          totalMoratoryAmount += installmentMoratoryAmount;
          totalDaysLate += installmentDaysLate;

          return {
            installmentId: installment.id,
            sequence: installment.sequence,
            dueDate: installment.dueDate.toISOString().split('T')[0],
            capitalAmount: Number(installment.capitalAmount).toFixed(2),
            interestAmount: Number(installment.interestAmount).toFixed(2),
            totalAmount: Number(installment.totalAmount).toFixed(2),
            paidAmount: Number(installment.paidAmount).toFixed(2),
            isPaid: installment.isPaid,
            moratoryAmount: installmentMoratoryAmount.toFixed(2),
            daysLate: installmentDaysLate
          };
        });

        return {
          loanId: loan.id,
          loanAmount: Number(loan.loanAmount).toFixed(2),
          remainingBalance: Number(loan.remainingBalance).toFixed(2),
          loanTypeName: this.translationService.translateLoanType(loan.loanType.name),
          loanStatusName: this.translationService.translateLoanStatus(loan.loanStatus.name),
          startDate: loan.startDate.toISOString().split('T')[0],

          customer: {
            id: loan.customer.id,
            name: `${loan.customer.firstName} ${loan.customer.lastName}`,
            documentNumber: loan.customer.documentNumber.toString(),
            phone: loan.customer.phone || '',
            address: loan.customer.address || '',
            zoneName: loan.customer.zone?.name || '',
            zoneCode: loan.customer.zone?.code || ''
          },

          installments: installmentsWithMoratory,

          totalMoratoryAmount: totalMoratoryAmount.toFixed(2),
          totalDaysLate,
          totalAmountOwed: totalMoratoryAmount.toFixed(2) // Total intereses moratorios
        };
      });

      return {
        overdueLoans,
        meta: {
          total,
          page,
          lastPage,
          limit,
          hasNextPage: page < lastPage,
        },
      };
    }

  async getLoansByCustomer(documentNumber: number) {
      // 1️⃣ Verificar que el cliente existe
      const customer = await this.prisma.customer.findUnique({
        where: { documentNumber },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!customer) {
        throw new NotFoundException(
          `Cliente con Numero de identificacion: ${documentNumber} no encontrado`,
        );
      }

      // 2️⃣ Obtener préstamos con SOLO la cuota más reciente
      const loans = await this.prisma.loan.findMany({
        where: { customerId: customer.id, isActive: true },
        include: {
          interestRate: true,
          penaltyRate: true,
          term: true,
          gracePeriod: true,
          paymentFrequency: true,
          loanType: true,
          loanStatus: true,
          installments: {
            where: { isActive: true },
            orderBy: { sequence: 'desc' },
            take: 1, // 🔥 solo la última
            include: {
              status: true,
              moratoryInterests: true,
            },
          },
        },
      });

      return loans.map((loan) => {
        let totalLateFees = 0;
        let totalDaysLate = 0;
        let pendingInstallmentsCount = 0;
        let overdueInstallmentsCount = 0;
        let paidInstallmentsCount = 0;

        const installments = loan.installments.map((inst) => {
          const pendingPrincipal =
            Number(inst.capitalAmount) - Number(inst.paidAmount);
          const pendingInterest =
            Number(inst.interestAmount) -
            Math.min(Number(inst.paidAmount), Number(inst.interestAmount));

          const lateFeeRecords = inst.moratoryInterests || [];
          const lateFee = lateFeeRecords.reduce(
            (acc, m) => acc + Number(m.amount),
            0,
          );
          const daysLate = lateFeeRecords.reduce(
            (acc, m) => acc + (m.daysLate ?? 0),
            0,
          );

          if (!inst.isPaid) {
            pendingInstallmentsCount++;
            totalLateFees += lateFee;
            totalDaysLate += daysLate;
            if (inst.status.name.toLowerCase().includes('Overdue Paid'))
              overdueInstallmentsCount++;
          } else {
            paidInstallmentsCount++;
          }

          return {
            installmentId: inst.id,
            sequence: inst.sequence,
            dueDate: inst.dueDate,
            status: inst.status.name,
            capitalAmount: Number(inst.capitalAmount),
            interestAmount: Number(inst.interestAmount),
            totalAmount: Number(inst.totalAmount),
            paidAmount: Number(inst.paidAmount),
            moratoryInterests: lateFeeRecords.map((m) => ({
              id: m.id,
              amount: Number(m.amount),
              daysLate: m.daysLate,
              paidAt: m.paidAt,
              paidAmount: Number(m.paidAmount),
              isPaid: m.isPaid,
              statusId: m.moratoryInterestStatusId,
            })),
            lateFee,
            daysLate,
            totalToPay: pendingPrincipal + pendingInterest + lateFee,
          };
        });

        return {
          loanId: loan.id,
          customer: { name: `${customer.firstName} ${customer.lastName}` },
          loanInfo: {
            status: loan.loanStatus.name,
            type: loan.loanType.name,
            startDate: loan.startDate,
            gracePeriod: loan.gracePeriod?.days ?? null,
            termValue: loan.term?.value ?? null,
            paymentFrequency: loan.paymentFrequency.name,
            paidInstallments: `${paidInstallmentsCount}/${loan.term?.value ?? '∞'
              }`,
            overdueInstallments: overdueInstallmentsCount,
            pendingInstallments: pendingInstallmentsCount,
          },
          summary: {
            remainingBalance: Number(loan.remainingBalance),
            totalLateFees,
            totalDaysLate,
          },
          installments,
        };
      });
    }

  async cancelLoan(loanId: number) {
      return await this.prisma.$transaction(async tx => {
        // 1️⃣ Buscar préstamo
        const loan = await tx.loan.findUnique({
          where: { id: loanId },
          include: {
            customer: {
              include: {
                typeDocumentIdentification: true,
                gender: true,
                zone: true,
                user: true
              }
            },
            loanStatus: true,
            loanType: true,
            interestRate: true,
            penaltyRate: true,
            term: true,
            paymentFrequency: true,
          }
        });

        if (!loan) throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);

        // 2️⃣ Buscar status CANCELLED (case-insensitive)
        const cancelledStatus = await tx.loanStatus.findFirst({
          where: { name: { equals: 'CANCELLED', mode: 'insensitive' } }
        });

        if (!cancelledStatus) throw new NotFoundException(`Status "CANCELLED" no encontrado`);

        // 3️⃣ Validar si ya está cancelado
        if (loan.loanStatusId === cancelledStatus.id && loan.isActive === false) {
          throw new BadRequestException('Este crédito ya está cancelado');
        }

        // 4️⃣ Actualizar préstamo
        const updatedLoan = await tx.loan.update({
          where: { id: loanId },
          data: {
            loanStatusId: cancelledStatus.id,
            isActive: false
          },
          include: {
            customer: {
              include: {
                typeDocumentIdentification: true,
                gender: true,
                zone: true,
                user: true
              }
            },
            loanStatus: true,
            loanType: true,
            interestRate: true,
            penaltyRate: true,
            term: true,
            paymentFrequency: true,
          }
        });

        // 5️⃣ Obtener cambios y mapear como en create
        const loanPlain = this.convertLoanToPlain(updatedLoan);
        const loanChanges = await this.changesService.getChanges('loan', updatedLoan.id);

        let customerWithTimestamps = loanPlain.customer;
        if (loanPlain.customer?.id) {
          try {
            const custChanges = await this.changesService.getChanges('customer', loanPlain.customer.id);
            customerWithTimestamps = {
              ...loanPlain.customer,
              createdAtTimestamp: custChanges.create?.timestamp,
              updatedAtTimestamp: custChanges.lastUpdate?.timestamp || custChanges.create?.timestamp,
            };
          } catch { }
        }

        const mappedLoan = this._mapLoan(loanPlain, loanChanges);
        mappedLoan.customer = {
          ...customerWithTimestamps,
          typeDocumentIdentificationName: customerWithTimestamps.typeDocumentIdentification?.name,
          typeDocumentIdentificationCode: customerWithTimestamps.typeDocumentIdentification?.code,
          genderName: customerWithTimestamps.gender?.name,
          zoneName: customerWithTimestamps.zone?.name,
          zoneCode: customerWithTimestamps.zone?.code,
          email: customerWithTimestamps.user.email
        };

        return mappedLoan;
      });
    }

  // ---------- HELPERS ----------
  private async ensureRefs(dto: CreateLoanDto): Promise<void> {
    const [customer, freq, type] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.paymentFrequency.findUnique({ where: { id: dto.paymentFrequencyId } }),
      this.prisma.loanType.findUnique({ where: { id: dto.loanTypeId } }),

    ]);
    if (!customer) throw new BadRequestException('Customer no encontrado');
    if (!freq) throw new BadRequestException('PaymentFrequency no encontrada');
    if (!type) throw new BadRequestException('LoanType no encontrada');
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

  private _mapLoan(loan: any, loanChanges: any) {
    // Mantener las relaciones completas para que el DTO pueda transformarlas
    return {
      ...loan,

      // Campos calculados del loan
      interestRateValue: loan.interestRate?.value ?? 0,
      penaltyRateValue: loan.penaltyRate?.value ?? 0,
      termValue: loan.term?.value ?? null,
      paymentFrequencyName: this.translationService.translatePaymentFrequency(loan.paymentFrequency?.name || ''),
      loanTypeName: this.translationService.translateLoanType(loan.loanType?.name || ''),
      loanStatusName: this.translationService.translateLoanStatus(loan.loanStatus?.name || ''),

      // ✅ Agregar nombre del cliente
      customerName: loan.customer ? `${loan.customer.firstName || ''} ${loan.customer.lastName || ''}`.trim() : '',

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