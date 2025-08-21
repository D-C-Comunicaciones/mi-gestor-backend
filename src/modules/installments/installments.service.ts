// installments.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { Prisma, PrismaClient } from '@prisma/client';
import { CreateInstallmentDto } from './dto';

@Injectable()
export class InstallmentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateInstallmentDto, db?: Prisma.TransactionClient | PrismaClient) {
    const prismaClient = db ?? this.prisma;

    // Traer el préstamo con sus relaciones
    const loan = await prismaClient.loan.findUnique({
      where: { id: dto.loanId },
      include: { 
        interestRate: true, 
        loanType: true, 
        paymentFrequency: true,
        term: true
      },
    });
    if (!loan) throw new BadRequestException('Loan no encontrado');

    // Validar existencia de PaymentFrequency
    const freq = await prismaClient.paymentFrequency.findUnique({
      where: { id: dto.paymentFrequencyId },
    });
    if (!freq) throw new BadRequestException('PaymentFrequency no encontrada');

    const incrementer = this.getDateIncrementer(freq.name);
    
    // ✅ Usar el count proporcionado O el valor del término
    const numberOfInstallments = dto.count ?? (loan.term?.value || 0);

    if (numberOfInstallments <= 0) {
      return []; // No generar cuotas si el count es 0 o negativo
    }

    let currentDate = new Date(dto.startDate);
    let remainingPrincipal = loan.loanAmount;

    // Normalizar tasa de interés
    const interestRate = loan.interestRate.value.greaterThan(1)
      ? loan.interestRate.value.div(100)
      : loan.interestRate.value;

    const data: Prisma.InstallmentCreateManyInput[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      // ✅ La PRIMERA cuota también se incrementa según la frecuencia
      if (i === 1) {
        currentDate = incrementer(currentDate);
      } else {
        currentDate = incrementer(currentDate);
      }

      // Interés sobre saldo pendiente
      const interestAmount = remainingPrincipal
        .mul(interestRate)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // Capital de la cuota
      let capitalAmount = remainingPrincipal
        .div(numberOfInstallments - i + 1)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // Ajustar última cuota
      if (i === numberOfInstallments) {
        capitalAmount = remainingPrincipal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      }

      // Total cuota = capital + interés
      const totalAmount = capitalAmount
        .add(interestAmount)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // Actualizar saldo pendiente
      remainingPrincipal = remainingPrincipal
        .sub(capitalAmount)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

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

    return data;
  }

  /** Obtiene el incrementador de fecha según la frecuencia */
  private getDateIncrementer(frequencyName: string): (date: Date) => Date {
    const freq = frequencyName.toUpperCase();
    
    if (freq.includes('DIARIA') || freq.includes('DAILY')) {
      return (date) => addDays(date, 1);
    }
    if (freq.includes('SEMANAL') || freq.includes('WEEKLY')) {
      return (date) => addWeeks(date, 1);
    }
    if (freq.includes('QUINCENAL') || freq.includes('BIWEEKLY')) {
      return (date) => addDays(date, 15);
    }
    if (freq.includes('MENSUAL') || freq.includes('MONTHLY')) {
      return (date) => addMonths(date, 1);
    }
    
    return (date) => addMonths(date, 1);
  }

  /** Calcula número de cuotas según tipo de préstamo y frecuencia (backup) */
  private calculateInstallments(
    principal: number,
    loanTypeId: number,
    interestRate: number,
    frequency: string
  ): number {
    if (loanTypeId !== 1) return 0;
    const u = frequency.toUpperCase();
    if (u.includes('DAILY')) return 30;
    if (u.includes('WEEK')) return 12;
    if (u.includes('BIWEEK')) return 12;
    if (u.includes('MONTH')) return 12;
    return 12;
  }
}