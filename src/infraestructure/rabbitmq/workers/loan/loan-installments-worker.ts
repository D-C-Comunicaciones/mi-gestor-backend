import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { InstallmentsService } from '@modules/installments/installments.service';

@Injectable()
export class LoanInstallmentWorker implements OnModuleInit {
  private readonly logger = new Logger(LoanInstallmentWorker.name);
  private readonly maxProcessingAttempts = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly installmentsService: InstallmentsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Iniciando LoanInstallmentWorker...');
    await this.rabbitMqService.waitForConnection();
    await this.rabbitMqService.assertQueue(envs.rabbitMq.loanInstallmentsQueue);

    // Inicia consumo directo de la cola
    await this.rabbitMqService.consume(
      envs.rabbitMq.loanInstallmentsQueue,
      (msg) => this.handleMessage(msg).catch(e => this.logger.error(e))
    );
    this.logger.log('✅ Consumo de mensajes iniciado');
  }

  private async handleMessage(msg: any): Promise<void> {
    if (!msg) return;

    const content = msg.content?.toString() ?? '';
    this.logger.log(`📩 Mensaje recibido: ${content}`);

    try {
      const { loanId, remainingInstallments } = JSON.parse(content);
      if (!loanId) return this.logger.warn('⚠️ Mensaje inválido: falta loanId');

      await this.processLoanWithRetry(loanId, remainingInstallments);
    } catch (error) {
      this.logger.error('❌ Error parseando mensaje:', error);
    }
  }

  private async processLoanWithRetry(loanId: number, remainingInstallments: number | null, attempt = 1) {
    try {
      await this.processLoanInstallment(loanId, remainingInstallments);
    } catch (error) {
      this.logger.error(`❌ Error procesando loan ${loanId} (intento ${attempt}):`, error);
      if (attempt < this.maxProcessingAttempts) {
        await new Promise(r => setTimeout(r, attempt * 2000));
        await this.processLoanWithRetry(loanId, remainingInstallments, attempt + 1);
      }
    }
  }

  private async processLoanInstallment(loanId: number, remainingInstallments: number | null) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId, isActive: true },
      include: { installments: { orderBy: { sequence: 'desc' }, take: 1 }, paymentFrequency: true, loanType: true, term: true },
    });
    if (!loan) return;

    const nextSequence = (loan.installments[0]?.sequence ?? 0) + 1;

    // fixed_fees: verificar límite de cuotas
    if (loan.loanType.name === 'fixed_fees' && loan.term?.value && nextSequence > loan.term.value) return;

    const installment = await this.installmentsService.createNextInstallment(loanId);
    this.logger.log(`💰 Cuota creada: id=${installment.id}, secuencia=${installment.sequence}`);

    // republicar mensaje con delay si aplica
    if (loan.loanType.name === 'fixed_fees') {
      const termValue = loan.term?.value ?? 0;
      const newRemaining = termValue - installment.sequence;
      if (newRemaining > 0) {
        const delay = this.calculateNextDelay(loan.paymentFrequency.name);
        await this.rabbitMqService.publishWithDelay(
          envs.rabbitMq.loanInstallmentsQueue,
          { loanId, remainingInstallments: newRemaining },
          delay
        );
      }
    } else if (loan.loanType.name === 'only_interests' && Number(loan.remainingBalance) > 0) {
      const delay = this.calculateNextDelay(loan.paymentFrequency.name);
      await this.rabbitMqService.publishWithDelay(envs.rabbitMq.loanInstallmentsQueue, { loanId }, delay);
    }
  }

  private calculateNextDelay(frequency: string): number {
    const freq = frequency.toUpperCase();
    const delays: Record<string, number> = {
      MINUTO: 60000, MINUTE: 60000,
      HORA: 3600000, HOURLY: 3600000,
      DIARIA: 86400000, DAILY: 86400000,
      SEMANAL: 604800000, WEEKLY: 604800000,
      QUINCENAL: 1296000000, BIWEEKLY: 1296000000,
      MENSUAL: 2592000000, MONTHLY: 2592000000,
      ANUAL: 31536000000, YEARLY: 31536000000,
    };
    return delays[freq] ?? 10000;
  }
}
