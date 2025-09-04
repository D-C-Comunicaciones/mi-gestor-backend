import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

@Injectable()
export class AdvancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
  ) {}

  private readonly logger = new Logger(AdvancesService.name);

  // ---------- CREATE ADVANCE ----------
  async create(dto: CreateAdvanceDto) {
    return await this.prisma.$transaction(async tx => {
      // 1️⃣ Validar préstamo y cliente
      const loan = await tx.loan.findUnique({
        where: { id: dto.loanId },
        include: { customer: true }
      });

      if (!loan) {
        throw new NotFoundException('Préstamo no encontrado');
      }

      if (!loan.isActive) {
        throw new BadRequestException('No se puede hacer abonos a un préstamo inactivo');
      }

      if (loan.customerId !== dto.customerId) {
        throw new BadRequestException('El préstamo no pertenece al cliente especificado');
      }

      // 2️⃣ Validar cobrador si se proporciona
      if (dto.collectorId) {
        const collector = await tx.collector.findUnique({
          where: { id: dto.collectorId }
        });
        if (!collector || !collector.isActive) {
          throw new BadRequestException('Cobrador no encontrado o inactivo');
        }
      }

      // 3️⃣ Validar que el monto no exceda la deuda
      if (dto.amount > loan.remainingBalance.toNumber()) {
        throw new BadRequestException(`El abono ($${dto.amount}) no puede ser mayor al saldo pendiente ($${loan.remainingBalance.toNumber()})`);
      }

      // 4️⃣ Crear el abono
      const advance = await tx.advance.create({
        data: {
          customerId: dto.customerId,
          loanId: dto.loanId,
          amount: new Prisma.Decimal(dto.amount),
          remainingAmount: new Prisma.Decimal(dto.amount),
          collectorId: dto.collectorId,
          notes: dto.notes,
        },
        include: {
          customer: true,
          loan: true,
          collector: true,
        }
      });

      // 5️⃣ Actualizar saldo del préstamo
      await tx.loan.update({
        where: { id: dto.loanId },
        data: {
          remainingBalance: new Prisma.Decimal(
            loan.remainingBalance.toNumber() - dto.amount
          ),
        }
      });

      // 6️⃣ Crear registro de pago para trazabilidad
      await tx.payment.create({
        data: {
          loanId: dto.loanId,
          amount: new Prisma.Decimal(dto.amount),
          paymentTypeId: 2, // Asumiendo que 2 = abono
          collectorId: dto.collectorId,
          appliedToCapital: new Prisma.Decimal(dto.amount),
          appliedToInterest: new Prisma.Decimal(0),
          appliedToLateFee: new Prisma.Decimal(0),
          date: new Date(),
        }
      });

      return this.convertAdvanceToPlain(advance);
    });
  }

  // ---------- FIND ALL ADVANCES ----------
  async findAll(page = 1, limit = 10, filters?: { customerId?: number; loanId?: number }) {
    const where: Prisma.AdvanceWhereInput = { isActive: true };
    
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.loanId) where.loanId = filters.loanId;

    const total = await this.prisma.advance.count({ where });
    
    if (total === 0) {
      return {
        advances: [],
        meta: { total: 0, page: 1, lastPage: 0, limit, hasNextPage: false },
      };
    }

    const advances = await this.prisma.advance.findMany({
      where,
      include: {
        customer: true,
        loan: true,
        collector: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      advances: advances.map(a => this.convertAdvanceToPlain(a)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        hasNextPage: page < Math.ceil(total / limit),
      },
    };
  }

  // ---------- APPLY ADVANCE TO INSTALLMENTS ----------
  async applyAdvanceToNextInstallments(loanId: number) {
    return await this.prisma.$transaction(async tx => {
      // Obtener abonos pendientes del préstamo
      const advances = await tx.advance.findMany({
        where: {
          loanId,
          remainingAmount: { gt: 0 },
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (advances.length === 0) {
        return { message: 'No hay abonos pendientes por aplicar' };
      }

      // Obtener cuotas pendientes del préstamo
      const installments = await tx.installment.findMany({
        where: {
          loanId,
          isPaid: false,
          isActive: true,
        },
        orderBy: { sequence: 'asc' },
      });

      let appliedTotal = 0;

      for (const advance of advances) {
        let remainingAdvance = advance.remainingAmount.toNumber();

        for (const installment of installments) {
          if (remainingAdvance <= 0) break;

          const pendingAmount = installment.totalAmount.toNumber() - installment.paidAmount.toNumber();
          if (pendingAmount <= 0) continue;

          const applicationAmount = Math.min(remainingAdvance, pendingAmount);
          
          // Actualizar cuota
          const newPaidAmount = installment.paidAmount.toNumber() + applicationAmount;
          await tx.installment.update({
            where: { id: installment.id },
            data: {
              paidAmount: new Prisma.Decimal(newPaidAmount),
              isPaid: newPaidAmount >= installment.totalAmount.toNumber(),
              paidAt: newPaidAmount >= installment.totalAmount.toNumber() ? new Date() : null,
            }
          });

          remainingAdvance -= applicationAmount;
          appliedTotal += applicationAmount;
        }

        // Actualizar abono
        await tx.advance.update({
          where: { id: advance.id },
          data: {
            appliedAmount: new Prisma.Decimal(
              advance.appliedAmount.toNumber() + (advance.remainingAmount.toNumber() - remainingAdvance)
            ),
            remainingAmount: new Prisma.Decimal(remainingAdvance),
          }
        });
      }

      return {
        message: `Se aplicaron $${appliedTotal} de abonos a las cuotas`,
        appliedAmount: appliedTotal,
      };
    });
  }

  private convertAdvanceToPlain(obj: any): any {
    const jsonString = JSON.stringify(obj, (key, value) => {
      if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
        return value.toNumber();
      }
      return value;
    });

    return JSON.parse(jsonString);
  }
}
