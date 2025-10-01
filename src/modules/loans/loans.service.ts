import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { InstallmentsService } from '@modules/installments/installments.service';
import { CreateLoanDto, UpdateLoanDto, RefinanceLoanDto, LoanPaginationDto } from './dto';
import { differenceInDays, format } from 'date-fns';
import { PaginationDto } from '@common/dto';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
    private readonly installmentsService: InstallmentsService,
  ) { }

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
          termId,
          gracePeriodId,
          graceEndDate,
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
        zoneCode: customerWithTimestamps.zone?.code,
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

  // ---------- REFINANCE ----------
  async refinance(loanId: number, dto: RefinanceLoanDto) {
    // 1️⃣ Obtener el préstamo existente con todas las relaciones necesarias
    const existingLoan = await this.prisma.loan.findUnique({
      where: { id: loanId },
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
        installments: true,
      },
    });
    if (!existingLoan) {
      throw new NotFoundException('Préstamo a refinanciar no encontrado');
    }

    if (!existingLoan.isActive) {
      throw new BadRequestException('El préstamo ya está inactivo o refinanciado.');
    }

    const refinancedStatus = await this.prisma.loanStatus.findUnique({
      where: { name: 'Refinanced' }
    });
    if (!refinancedStatus) {
      throw new NotFoundException('El estado "Refinanced" no fue encontrado. Por favor, asegúrese de que el seed ha sido ejecutado.');
    }

    // 2️⃣ Lógica para priorizar datos del nuevo DTO o tomar los del préstamo anterior,
    //    asegurando que el customerId sea siempre el mismo
    const newLoanDto: CreateLoanDto = {
      customerId: existingLoan.customerId,
      loanAmount: dto.loanAmount ?? existingLoan.loanAmount.toNumber(),
      interestRateId: dto.interestRateId ?? existingLoan.interestRateId,
      // ✅ Correcciones para el problema de tipos: 'null' vs 'undefined'
      penaltyRateId: dto.penaltyRateId ?? existingLoan.penaltyRateId ?? undefined,
      termId: dto.termId ?? existingLoan.termId ?? undefined,
      paymentFrequencyId: dto.paymentFrequencyId ?? existingLoan.paymentFrequencyId,
      loanTypeId: dto.loanTypeId ?? existingLoan.loanTypeId,
      // ✅ Corrección para nextDueDate
      nextDueDate: dto.nextDueDate ?? existingLoan.nextDueDate?.toISOString() ?? undefined,
      // ✅ Corrección para gracePeriodId
      gracePeriodId: dto.gracePeriodId ?? existingLoan.gracePeriodId ?? undefined,
    };

    // 3️⃣ Transacción para asegurar la atomicidad
    const { oldLoan, newLoan } = await this.prisma.$transaction(async tx => {
      // Inactivar y cambiar el estado del préstamo antiguo
      const inactiveLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          isActive: false,
          loanStatusId: refinancedStatus.id,
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
              user: true,
            },
          },
          installments: true,
        },
      });

      // Crear el nuevo préstamo con los datos priorizados
      const newLoanResponse = await this.create(newLoanDto);

      return {
        oldLoan: inactiveLoan,
        newLoan: newLoanResponse.loan,
      };
    });

    // 4️⃣ Mapear y devolver ambos préstamos
    const oldLoanChanges = await this.changesService.getChanges('loan', oldLoan.id);
    const newLoanChanges = await this.changesService.getChanges('loan', newLoan.id);

    const oldMapped = this._mapLoan(this.convertLoanToPlain(oldLoan), oldLoanChanges);
    const newMapped = this._mapLoan(this.convertLoanToPlain(newLoan), newLoanChanges);

    return { oldMapped, newMapped };
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

  async findOne(id: number, include?: string) {
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

    // Construir filtros
    const where: any = {
      isActive: true,
      installments: {
        some: {
          isActive: true,
          isPaid: false,
          status: { name: { contains: 'Overdue' } },
        },
      },
    };

    // Obtener total de registros
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

    // Obtener préstamos con cuotas en mora
    const loans = await this.prisma.loan.findMany({
      where,
      include: {
        customer: {
          include: {
            zone: true,
            typeDocumentIdentification: true,
            collectionRoute: {
              select: {
                id: true,
                name: true,
                collector: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            }
          },
        },
        loanType: true,
        loanStatus: true,
        installments: {
          where: {
            isActive: true,
            isPaid: false,
            status: { name: { contains: 'Overdue' } },
          },
          include: {
            status: true,
            moratoryInterests: {
              include: {
                moratoryInterestStatus: true
              },
              orderBy: { id: 'asc' }
            },
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mapear resultados
    const overdueLoans = loans.map((loan) => {
      const overdueInstallments = loan.installments.map((installment) => {
        const capitalAmount = Number(installment.capitalAmount);
        const interestAmount = Number(installment.interestAmount);
        const totalAmount = Number(installment.totalAmount);
        const paidAmount = Number(installment.paidAmount);
        const pendingAmount = totalAmount - paidAmount;

        // 📌 Filtrar solo intereses moratorios NO pagados y calcular totales
        const unpaidMoras = installment.moratoryInterests.filter(mora => !mora.isPaid);
        
        const lateFeeAmount = unpaidMoras.reduce((sum, mora) => {
          const moraAmount = Number(mora.amount);
          const moraPaidAmount = Number(mora.paidAmount);
          const pendingMoraAmount = moraAmount - moraPaidAmount;
          return sum + Math.max(pendingMoraAmount, 0); // Solo el monto pendiente
        }, 0);

        const totalDaysLate = unpaidMoras.reduce((sum, mora) => {
          return sum + (mora.daysLate || 0);
        }, 0);

        // Total adeudado (pendiente de la cuota + mora pendiente)
        const totalOwed = pendingAmount + lateFeeAmount;

        return {
          id: installment.id,
          sequence: installment.sequence,
          dueDate: installment.dueDate.toISOString().split('T')[0],
          daysLate: totalDaysLate,
          capitalAmount: capitalAmount.toFixed(2),
          interestAmount: interestAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paidAmount: paidAmount.toFixed(2),
          pendingAmount: pendingAmount.toFixed(2),
          lateFeeAmount: lateFeeAmount.toFixed(2),
          totalOwed: totalOwed.toFixed(2),
          statusName: this.translateInstallmentStatus(installment.status.name),

          // 🔥 Solo mostrar intereses moratorios NO pagados con monto pendiente
          moratoryInterests: unpaidMoras
            .map((m) => {
              const moraAmount = Number(m.amount);
              const moraPaidAmount = Number(m.paidAmount);
              const pendingMoraAmount = moraAmount - moraPaidAmount;
              
              return {
                id: m.id,
                amount: moraAmount.toFixed(2),
                paidAmount: moraPaidAmount.toFixed(2),
                pendingAmount: Math.max(pendingMoraAmount, 0).toFixed(2),
                daysLate: m.daysLate,
                paidAt: m.paidAt,
                isPaid: m.isPaid,
                statusId: m.moratoryInterestStatusId,
                statusName: m.moratoryInterestStatus?.name || 'unknown'
              };
            })
            .filter(m => Number(m.pendingAmount) > 0), // Solo mostrar los que tienen monto pendiente

          // 📊 Resumen de moratorios para esta cuota
          moratoryInterestsSummary: {
            totalUnpaidCount: unpaidMoras.length,
            totalPaidCount: installment.moratoryInterests.filter(m => m.isPaid).length,
            totalUnpaidAmount: lateFeeAmount.toFixed(2),
            totalDaysLate: totalDaysLate
          }
        };
      });

      // Calcular totales del préstamo (solo cuotas con mora pendiente)
      const installmentsWithPendingMora = overdueInstallments.filter(inst => Number(inst.totalOwed) > Number(inst.pendingAmount));
      
      const totalDaysLate = overdueInstallments.reduce(
        (sum, inst) => sum + inst.daysLate,
        0,
      );
      
      const totalAmountOwed = overdueInstallments.reduce(
        (sum, inst) => sum + Number(inst.totalOwed),
        0,
      );

      const totalLateFeeAmount = overdueInstallments.reduce(
        (sum, inst) => sum + Number(inst.lateFeeAmount),
        0,
      );

      return {
        loanId: loan.id,
        loanAmount: Number(loan.loanAmount).toFixed(2),
        remainingBalance: Number(loan.remainingBalance).toFixed(2),
        loanTypeName: this.translateLoanType(loan.loanType.name),
        startDate: loan.startDate.toISOString().split('T')[0],
        totalDaysLate,
        totalAmountOwed: totalAmountOwed.toFixed(2),
        totalLateFeeAmount: totalLateFeeAmount.toFixed(2),
        installmentsWithMora: installmentsWithPendingMora.length,
        customer: {
          id: loan.customer.id,
          name: `${loan.customer.firstName} ${loan.customer.lastName}`,
          documentNumber: loan.customer.documentNumber.toString(),
          phone: loan.customer.phone || '',
          address: loan.customer.address || '',
          zoneName: loan.customer.zone?.name || '',
          zoneCode: loan.customer.zone?.code || '',
          collectionRoute: loan.customer.collectionRoute ? {
            id: loan.customer.collectionRoute.id,
            name: loan.customer.collectionRoute.name,
            collector: loan.customer.collectionRoute.collector ? {
              id: loan.customer.collectionRoute.collector.id,
              name: `${loan.customer.collectionRoute.collector.firstName} ${loan.customer.collectionRoute.collector.lastName}`,
              phone: loan.customer.collectionRoute.collector.phone || ''
            } : null
          } : null
        },
        overdueInstallments,
        // 📊 Resumen general del préstamo
        loanMoratorySummary: {
          totalInstallmentsInMora: overdueInstallments.length,
          totalInstallmentsWithPendingMora: installmentsWithPendingMora.length,
          totalUnpaidMoratoryAmount: totalLateFeeAmount.toFixed(2),
          totalDaysLateAccumulated: totalDaysLate,
          averageDaysLatePerInstallment: overdueInstallments.length > 0 
            ? Math.round(totalDaysLate / overdueInstallments.length) 
            : 0
        }
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

  // // ---------- UPDATE ----------
  // async update(id: number, dto: UpdateLoanDto) {
  //   const existing = await this.prisma.loan.findUnique({
  //     where: { id },
  //     include: {
  //       interestRate: true,
  //       term: true,
  //       paymentFrequency: true,
  //       loanType: true,
  //       loanStatus: true,
  //     }
  //   });

  //   if (!existing) throw new NotFoundException('Préstamo no encontrado');

  //   const detected = this.detectChanges(existing, dto);
  //   if (!Object.keys(detected).length) throw new BadRequestException('No se detectaron cambios.');

  //   const data: Prisma.LoanUpdateInput = {};
  //   const changes: any = [];

  //   // Campos escalares
  //   if (detected.remainingBalance !== undefined) {
  //     data.remainingBalance = new Prisma.Decimal(detected.remainingBalance);
  //     changes.push({
  //       field: 'remainingBalance',
  //       old: existing.remainingBalance?.toNumber?.(),
  //       new: detected.remainingBalance
  //     });
  //   }

  //   if (detected.nextDueDate !== undefined) {
  //     data.nextDueDate = detected.nextDueDate === null ?
  //       null : new Date(detected.nextDueDate);
  //     changes.push({
  //       field: 'nextDueDate',
  //       old: existing.nextDueDate,
  //       new: detected.nextDueDate
  //     });
  //   }

  //   if (detected.isActive !== undefined) {
  //     data.isActive = detected.isActive;
  //     changes.push({
  //       field: 'isActive',
  //       old: existing.isActive,
  //       new: detected.isActive
  //     });
  //   }

  //   // Relaciones
  //   if (detected.loanStatusId !== undefined) {
  //     data.loanStatus = { connect: { id: detected.loanStatusId } };
  //     changes.push({
  //       field: 'loanStatusId',
  //       old: existing.loanStatusId,
  //       new: detected.loanStatusId
  //     });
  //   }

  //   if (detected.paymentFrequencyId !== undefined) {
  //     data.paymentFrequency = { connect: { id: detected.paymentFrequencyId } };
  //     changes.push({
  //       field: 'paymentFrequencyId',
  //       old: existing.paymentFrequencyId,
  //       new: detected.paymentFrequencyId
  //     });
  //   }

  //   if (detected.loanTypeId !== undefined) {
  //     data.loanType = { connect: { id: detected.loanTypeId } };
  //     changes.push({
  //       field: 'loanTypeId',
  //       old: existing.loanTypeId,
  //       new: detected.loanTypeId
  //     });
  //   }

  //   if (detected.interestRateId !== undefined) {
  //     data.interestRate = { connect: { id: detected.interestRateId } };
  //     changes.push({
  //       field: 'interestRateId',
  //       old: existing.interestRateId,
  //       new: detected.interestRateId
  //     });
  //   }

  //   if (detected.termId !== undefined) {
  //     data.term = { connect: { id: detected.termId } };
  //     changes.push({
  //       field: 'termId',
  //       old: existing.termId,
  //       new: detected.termId
  //     });
  //   }

  //   const updatedCore = await this.prisma.loan.update({
  //     where: { id },
  //     data,
  //     include: {
  //       interestRate: true,
  //       term: true,
  //       paymentFrequency: true,
  //       loanType: true,
  //       loanStatus: true,
  //     }
  //   });

  //   const updatedWithTimestamps = await this.appendTimestamps(updatedCore);
  //   const updated = this.convertLoanToPlain(updatedWithTimestamps);

  //   return { updated, changes };
  // }

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
          if (inst.status.name.toLowerCase().includes('overdue'))
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
        } catch {}
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

  // ✅ Métodos de traducción
  private translateLoanType(loanTypeName: string): string {
    const translations = {
      'fixed_fees': 'Cuotas Fijas',
      'only_interests': 'Interés Mensual',
    };
    return translations[loanTypeName] || loanTypeName;
  }

  private translatePaymentFrequency(frequencyName: string): string {
    const translations = {
      'Minute': 'Minuto',
      'Weekly': 'Semanal',
      'Biweekly': 'Quincenal',
      'Monthly': 'Mensual',
      'Daily': 'Diario',
    };
    return translations[frequencyName] || frequencyName;
  }

  private translateLoanStatus(statusName: string): string {
    const translations = {
      'Up to Date': 'Al día',
      'Overdue': 'En Mora',
      'Paid': 'Pagado',
      'Cancelled': 'Cancelado',
      'Refinanced': 'Refinanciado',
      'Outstanding Balance': 'Saldo Pendiente',
    };
    return translations[statusName] || statusName;
  }

  // Método auxiliar para traducir estados de cuotas
  private translateInstallmentStatus(statusName: string): string {
    const translations = {
      'Pending': 'Pendiente',
      'Paid': 'Pagado',
      'Overdue': 'En Mora',
      'Overdue Paid': 'Mora Pagada',
      'Partial': 'Parcial',
      'Partial Paid': 'Parcial Pagado',
      'Late': 'Tardío',
      'Late Paid': 'Tardío Pagado',
    };
    return translations[statusName] || statusName;
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
      paymentFrequencyName: this.translatePaymentFrequency(loan.paymentFrequency?.name || ''), // ✅ Traducido
      loanTypeName: this.translateLoanType(loan.loanType?.name || ''), // ✅ Traducido
      loanStatusName: this.translateLoanStatus(loan.loanStatus?.name || ''), // ✅ Traducido

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