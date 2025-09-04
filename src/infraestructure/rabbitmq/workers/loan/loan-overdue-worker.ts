import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { Decimal } from '@prisma/client/runtime/library';
import { startOfDay, isBefore } from 'date-fns';

@Injectable()
export class LoanOverdueWorker implements OnModuleInit {
  private readonly logger = new Logger(LoanOverdueWorker.name);
  private isConsuming = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Iniciando LoanOverdueWorker...');
    await this.rabbitMqService.waitForConnection();
    await this.rabbitMqService.assertQueue(envs.rabbitMq.loanOverdueQueue);
    this.logger.log(`✅ Cola asegurada: ${envs.rabbitMq.loanOverdueQueue}`);
    await this.startConsuming();
  }

  private async handleMessage(msg: any) {
    if (!msg) return;
    const content = msg.content?.toString() ?? '';
    const { loanId } = JSON.parse(content);
    if (!loanId) {
      this.logger.warn('⚠️ Mensaje sin loanId, se descarta');
      return;
    }

    this.logger.log(`📩 Procesando loanId=${loanId}`);

    // Normalizamos fecha actual a inicio del día
    const today = startOfDay(new Date());

    const installments = await this.prisma.installment.findMany({
      where: { loanId },
      include: { loan: { include: { penaltyRate: true } }, status: true }
    });

    if (!installments.length) {
      this.logger.warn(`⚠️ No se encontraron cuotas para loanId=${loanId}`);
      return;
    }

    const loan = installments[0].loan;
    const penaltyRateValue = loan.penaltyRate?.value ?? 0;
    const penaltyRateDecimal = new Decimal(penaltyRateValue).div(100);
    this.logger.log(`📉 Tasa penalización=${penaltyRateDecimal.toString()}`);

    // Buscar status de cuotas
    const [pendingStatus, overdueStatus] = await Promise.all([
      this.prisma.installmentStatus.findUnique({ where: { name: 'Pending' } }),
      this.prisma.installmentStatus.findUnique({ where: { name: 'Created' } }) // Usamos 'Created' como "Overdue"
    ]);

    const loanStatuses = await this.prisma.loanStatus.findMany({
      where: { name: { in: ['Outstanding Balance', 'Overdue', 'Up to Date'] } }
    });

    const outstandingBalanceId = loanStatuses.find(s => s.name === 'Outstanding Balance')?.id;
    const overdueId = loanStatuses.find(s => s.name === 'Overdue')?.id;
    const upToDateId = loanStatuses.find(s => s.name === 'Up to Date')?.id;

    let hayPendientes = false;
    let hayMora = false;

    for (const installment of installments) {
      const total = Number(installment.totalAmount);
      const paid = Number(installment.paidAmount);
      const dueDateOnly = startOfDay(new Date(installment.dueDate));

      this.logger.log(
        `🔎 Evaluando cuota=${installment.id} | total=${total} | paid=${paid} | isPaid=${installment.isPaid} | dueDate=${dueDateOnly.toISOString().split('T')[0]}`
      );

      // --- VALIDACIÓN DE ABONO PARCIAL ---
      if (installment.isPaid && paid > 0 && paid < total) {
        hayPendientes = true;
        this.logger.log(`✅ Cuota ${installment.id} detectada como OUTSTANDING BALANCE (abono parcial)`);

        if (pendingStatus && installment.statusId !== pendingStatus.id) {
          await this.prisma.installment.update({
            where: { id: installment.id },
            data: { statusId: pendingStatus.id }
          });
          this.logger.log(`📝 Cuota ${installment.id} ➝ PENDING`);
        }
        continue;
      }

      // --- VALIDACIÓN DE MORA SOLO SI LA FECHA YA PASÓ ---
      if (!installment.isPaid && isBefore(dueDateOnly, today)) {
        hayMora = true;
        this.logger.warn(`⛔ Cuota ${installment.id} está en MORA (vencida el ${dueDateOnly.toISOString().split('T')[0]})`);

        if (overdueStatus && installment.statusId !== overdueStatus.id) {
          await this.prisma.installment.update({
            where: { id: installment.id },
            data: { statusId: overdueStatus.id }
          });
          this.logger.log(`📝 Cuota ${installment.id} ➝ OVERDUE`);
        }

        // Generar o actualizar interés moratorio
        const dailyInterest = new Decimal(loan.loanAmount)
          .mul(penaltyRateDecimal)
          .div(30);

        const existing = await this.prisma.moratoryInterest.findFirst({
          where: { installmentId: installment.id }
        });

        if (existing) {
          const newAmount = new Decimal(existing.amount).add(dailyInterest);
          await this.prisma.moratoryInterest.update({
            where: { id: existing.id },
            data: {
              amount: newAmount.toNumber(),
              daysLate: existing.daysLate + 1
            }
          });
          this.logger.log(`💰 Interés moratorio actualizado installmentId=${installment.id} -> ${newAmount.toNumber()}`);
        } else {
          await this.prisma.moratoryInterest.create({
            data: {
              installmentId: installment.id,
              amount: dailyInterest.toNumber(),
              daysLate: 1
            }
          });
          this.logger.log(`💰 Interés moratorio creado installmentId=${installment.id} -> ${dailyInterest.toNumber()}`);
        }
      } else {
        this.logger.log(`⏳ Cuota ${installment.id} aún NO ha vencido, no se marca en mora`);
      }
    }

    // --- ACTUALIZAR ESTADO DEL LOAN ---
    let nuevoEstado: number | null = null;
    if (hayMora && overdueId) {
      nuevoEstado = overdueId;
      this.logger.warn(`📌 Loan ${loan.id} ➝ OVERDUE`);
    } else if (!hayMora && hayPendientes && outstandingBalanceId) {
      nuevoEstado = outstandingBalanceId;
      this.logger.log(`📌 Loan ${loan.id} ➝ OUTSTANDING BALANCE`);
    } else if (!hayMora && !hayPendientes && upToDateId) {
      nuevoEstado = upToDateId;
      this.logger.log(`📌 Loan ${loan.id} ➝ UP TO DATE`);
    }

    if (nuevoEstado && loan.loanStatusId !== nuevoEstado) {
      await this.prisma.loan.update({
        where: { id: loan.id },
        data: { loanStatusId: nuevoEstado }
      });
      this.logger.log(`🔄 Estado del loan actualizado en DB`);
    }

    // --- Re-publicar mensaje para siguiente chequeo ---
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanOverdueQueue,
      { loanId },
      60 * 1000
    );
    this.logger.debug(`📤 Mensaje re-publicado para loanId=${loanId}`);
  }

  private async startConsuming() {
    if (this.isConsuming) return;
    await this.rabbitMqService.consume(envs.rabbitMq.loanOverdueQueue, (msg) => {
      this.handleMessage(msg).catch(err => this.logger.error('❌ Error procesando mensaje:', err));
    });
    this.isConsuming = true;
  }
}
