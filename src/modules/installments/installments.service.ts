import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { Prisma, PrismaClient } from '@prisma/client';
import { CreateInstallmentDto } from './dto';

@Injectable()
export class InstallmentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateInstallmentDto, db?: Prisma.TransactionClient | PrismaClient) {
    // Usar el cliente pasado (transacción) o el cliente normal
    const prismaClient = db ?? this.prisma;

    // Traer el préstamo con sus relaciones
    const loan = await prismaClient.loan.findUnique({
      where: { id: dto.loanId },
      include: { interestRate: true, loanType: true, paymentFrequency: true },
    });
    if (!loan) throw new BadRequestException('Loan no encontrado');

    // Validar existencia de PaymentFrequency
    const freq = await prismaClient.paymentFrequency.findUnique({
      where: { id: dto.paymentFrequencyId },
    });
    if (!freq) throw new BadRequestException('PaymentFrequency no encontrada');

    const incrementer = this.incrementer(freq.name);

    // Determinar número de cuotas
    const count = dto.count ?? this.calculateInstallments(
      loan.loanAmount.toNumber(),
      loan.loanType.id,
      loan.interestRate.value.toNumber(),
      freq.name
    );

    let currentDate = dto.startDate;
    let remainingPrincipal = loan.loanAmount;
    const interestRate = loan.interestRate.value;
    const data: Prisma.InstallmentCreateManyInput[] = [];

    for (let i = 1; i <= count; i++) {
      // Calcular fecha de vencimiento de la cuota
      currentDate = incrementer(currentDate, i === 1 ? 0 : 1);

      // Calcular interés sobre saldo pendiente
      const interestAmount = remainingPrincipal.mul(interestRate).toDecimalPlaces(2);

      // Capital de la cuota: repartir el saldo pendiente equitativamente
      let capitalAmount = remainingPrincipal.div(count - i + 1).toDecimalPlaces(2);

      // Ajustar última cuota para que el saldo llegue a 0
      if (i === count) capitalAmount = remainingPrincipal.toDecimalPlaces(2);

      const totalAmount = capitalAmount.add(interestAmount);

      // Actualizar saldo pendiente
      remainingPrincipal = remainingPrincipal.sub(capitalAmount).toDecimalPlaces(2);

      data.push({
        loanId: loan.id,
        sequence: i,
        dueDate: currentDate,
        capitalAmount,
        interestAmount,
        totalAmount,
        paidAmount: new Prisma.Decimal(0),
        isPaid: false,
        isActive: true,
        paidAt: null,
      });
    }

    if (data.length > 0) {
      await prismaClient.installment.createMany({ data });
    }

    return { created: data.length };
  }

  /** Calcula número de cuotas según tipo de préstamo y frecuencia */
  private calculateInstallments(
    principal: number,
    loanTypeId: number,
    interestRate: number,
    frequency: string
  ): number {
    if (loanTypeId !== 1) return 0;
    const u = frequency.toUpperCase();
    if (u.includes('DAILY')) return 30; // 30 días
    if (u.includes('WEEK')) return 12;  // 12 semanas
    if (u.includes('BIWEEK')) return 12; // 12 quincenas
    if (u.includes('MONTH')) return 12; // 12 meses
    return 12; // fallback
  }

  /** Devuelve función para incrementar fechas según frecuencia */
  private incrementer(name: string): (d: Date, step: number) => Date {
    const u = name.toUpperCase();
    if (u.includes('DAILY')) return (d, s) => addDays(d, s);
    if (u.includes('BIWEEK')) return (d, s) => addWeeks(d, s * 2);
    if (u.includes('WEEK')) return (d, s) => addWeeks(d, s);
    if (u.includes('MONTH')) return (d, s) => addMonths(d, s);
    return (d, s) => addMonths(d, s);
  }
}
