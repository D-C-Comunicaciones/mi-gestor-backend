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

    await this.rabbitMqService.consume(
      envs.rabbitMq.loanInstallmentsQueue,
      async (msg, ack, nack) => {
        try {
          const content = msg.content?.toString() ?? '';
          this.logger.log(`📩 Mensaje recibido: ${content}`);
          const { loanId, remainingInstallments } = JSON.parse(content);

          if (!loanId) {
            this.logger.warn('⚠️ Mensaje inválido: falta loanId');
            return ack(); // descartar mensaje inválido
          }

          await this.processLoanWithRetry(loanId, remainingInstallments);
          this.logger.log(`✅ Procesamiento finalizado para loanId=${loanId}`);
          ack(); // 🟢 CONFIRMAMOS el mensaje
        } catch (error) {
          this.logger.error('❌ Error general procesando mensaje:', error);
          nack(true); // 🔄 lo reencolamos para reintento posterior
        }
      }
    );

    this.logger.log('✅ Consumo de mensajes iniciado');
  }

  private async processLoanWithRetry(
    loanId: number,
    remainingInstallments: number | null,
    attempt = 1,
  ) {
    try {
      await this.processLoanInstallment(loanId, remainingInstallments);
    } catch (error) {
      this.logger.error(
        `❌ Error procesando crédito ${loanId} (intento ${attempt}):`,
        error,
      );
      if (attempt < this.maxProcessingAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        await this.processLoanWithRetry(loanId, remainingInstallments, attempt + 1);
      } else {
        throw error; // dejamos que el catch principal haga nack
      }
    }
  }

  private async processLoanInstallment(
    loanId: number,
    remainingInstallments: number | null,
  ) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId, isActive: true },
      include: {
        installments: { orderBy: { sequence: 'desc' }, take: 1 },
        paymentFrequency: true,
        loanType: true,
        term: true,
      },
    });

    if (!loan) {
      this.logger.warn(`⚠️ Loan ${loanId} no encontrado o inactivo`);
      return;
    }

    const nextSequence = (loan.installments[0]?.sequence ?? 0) + 1;

    // fixed_fees: verificar límite de cuotas
    if (loan.loanType.name === 'fixed_fees' && loan.term?.value) {
      if (
        remainingInstallments === null ||
        remainingInstallments <= 0 ||
        nextSequence > loan.term.value
      ) {
        this.logger.log(`ℹ️ No se crean más cuotas para loanId=${loanId}`);
        return;
      }
    }

    const installment = await this.installmentsService.createNextInstallment(loanId);
    if (!installment) {
      this.logger.warn(`⚠️ No se pudo crear siguiente cuota para loanId=${loanId}`);
      return;
    }

    this.logger.log(`💰 Cuota creada: id=${installment.id}, secuencia=${installment.sequence}`);

    const nextDueDate = installment.dueDate;
    const createNextDate = this.installmentsService.getNextCreateDate(
      new Date(nextDueDate),
      loan.paymentFrequency.name,
    );

    const delay = Math.max(createNextDate.getTime() - Date.now(), 50);

    if (loan.loanType.name === 'fixed_fees') {
      const termValue = loan.term?.value ?? 0;
      const newRemaining =
        remainingInstallments !== null
          ? remainingInstallments - 1
          : termValue - installment.sequence;

      if (newRemaining > 0) {
        await this.rabbitMqService.publishWithDelay(
          envs.rabbitMq.loanInstallmentsQueue,
          { loanId, remainingInstallments: newRemaining },
          delay,
        );
        this.logger.log(
          `⏱️ Mensaje reprogramado para loanId=${loanId}, remainingInstallments=${newRemaining}, delay=${delay}ms`,
        );
      }
    } else if (
      loan.loanType.name === 'only_interests' &&
      Number(loan.remainingBalance) > 0
    ) {
      await this.rabbitMqService.publishWithDelay(
        envs.rabbitMq.loanInstallmentsQueue,
        { loanId },
        delay,
      );
      this.logger.log(
        `⏱️ Mensaje reprogramado para loanId=${loanId}, remainingBalance=${loan.remainingBalance}, delay=${delay}ms`,
      );
    }
  }
}
